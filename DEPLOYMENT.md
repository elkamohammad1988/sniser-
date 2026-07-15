# Deploying Sniser

Sniser ships as two independently deployable units:

| Unit | Path | Runtime | Deploy target |
|---|---|---|---|
| **API** | `backend/` | Node 20 + Express + SQLite | Render (blueprint) or any Docker host |
| **Web** | `frontend/` | Static Vite/React bundle | Vercel or any static host / nginx |

The repository is **deployment-ready**: config, lockfiles, Dockerfiles, CI, and
migrations are all committed. Bringing it live only requires running a platform
CLI with your own credentials — no code changes.

> **Topology:** the browser loads the SPA from the web origin and calls the API
> at a different origin, so two variables must agree:
> the SPA's **`VITE_API_URL`** points at the API, and the API's **`CORS_ORIGIN`**
> allows the web origin. Everything below is about wiring those two correctly.

---

## 1. Prerequisites

- Node.js ≥ 20 (`node -v`)
- For containers: Docker with Compose v2 (`docker compose version`)
- Accounts/CLIs for your chosen path: [`render`](https://render.com/docs/cli) and/or [`vercel`](https://vercel.com/docs/cli)

Generate the two required secrets once:

```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
```

---

## 2. Environment variables

### API (`backend/`) — see `backend/.env.example`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | – | `development` | Set `production` when deployed |
| `PORT` | – | `4000` | Render blueprint uses `10000` |
| `CORS_ORIGIN` | **prod** | `http://localhost:5173` | The **web origin**, no trailing slash. Comma-separate multiple |
| `APP_URL` | – | `http://localhost:5173` | Web origin; used in email links |
| `JWT_ACCESS_SECRET` | **prod** | – | ≥32 chars. **Boot fails in prod without it** |
| `JWT_REFRESH_SECRET` | **prod** | – | ≥32 chars. **Boot fails in prod without it** |
| `DB_AUTO_MIGRATE` | – | `true` | Run migrations on boot |
| `DB_AUTO_SEED` | – | `false` in prod | `true` seeds catalog + **public-password demo accounts** |
| `DATABASE_PATH` | – | `./data/sniser.db` | SQLite file location |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | – | `admin@sniser.io` / `ChangeMe!2026` | Bootstrap admin — **change the password** |
| `COOKIE_SECURE` | – | `true` in prod | Keep `true` over HTTPS; `false` only for local http |
| `SMTP_*` | – | – | Unset → mail is written to `MAIL_OUTBOX_DIR` |
| `PLATFORM_FEE_BPS` / `RESALE_FEE_BPS` | – | `250` / `500` | Marketplace economics (basis points) |

Full list with inline docs: **`backend/.env.example`**. Every value is validated
at boot by `src/config/env.ts` (fails fast on invalid config).

### Web (`frontend/`) — see `frontend/.env.example`

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | **yes** | Full API base **including `/api/v1`**, no trailing slash. **Baked in at build time** |
| `VITE_WHATSAPP_URL` / `VITE_SITE_URL` / `VITE_SOCIAL_*` | – | Optional |

> ⚠️ `VITE_*` vars are inlined into the bundle **when it is built**. Changing them
> requires a rebuild, not just a restart.

---

## 3. Path A — Render (API) + Vercel (Web)

### 3a. API on Render

The blueprint lives at **`backend/render.yaml`** (service `sniser-api`, port
`10000`, health check `/healthz`). It generates `JWT_*` secrets and a random
`ADMIN_PASSWORD` automatically; `CORS_ORIGIN`, `APP_URL`, and `ADMIN_EMAIL` are
marked `sync: false` and prompted at create time.

```bash
render login                       # or: export RENDER_API_KEY=...
render blueprint launch backend/render.yaml
```

When prompted, set a **temporary** `CORS_ORIGIN=*` and a placeholder
`APP_URL` — you'll lock them down in step 3c. Wait for the deploy, then confirm:

```bash
curl https://sniser-api.onrender.com/healthz     # → {"status":"ok"}
```

Note the API URL. (Free plan cold-starts after ~15 min idle — the first request
after that takes 30–50 s.)

### 3b. Web on Vercel

```bash
cd frontend
vercel link                                        # once
vercel env add VITE_API_URL production             # value: https://<api-url>/api/v1
vercel --prod
```

Note the assigned Vercel URL (e.g. `https://sniser.vercel.app`).

### 3c. Lock the wiring

Point the API's CORS at the real web origin and redeploy:

```bash
render env set --service sniser-api \
  CORS_ORIGIN=https://sniser.vercel.app \
  APP_URL=https://sniser.vercel.app
render deploys create --service sniser-api --wait
```

No trailing slashes. Also update the placeholder domain in
`frontend/index.html` (canonical / OG tags) to the real URL and redeploy the web.

---

## 4. Path B — Docker / Compose

Run the whole stack locally from the production images (mirrors the deployed
topology):

```bash
docker compose up --build
# web → http://localhost:8080     api → http://localhost:10000
```

Compose seeds the catalog (`DB_AUTO_SEED=true`) and disables `COOKIE_SECURE`
(plain-http localhost). Override the dev secrets for anything real:

```bash
JWT_ACCESS_SECRET=$(openssl rand -hex 48) JWT_REFRESH_SECRET=$(openssl rand -hex 48) \
  docker compose up --build
```

Build the images individually for any container host:

```bash
docker build -t sniser-api ./backend
docker build -t sniser-web --build-arg VITE_API_URL=https://your-api/api/v1 ./frontend
```

The API image persists state in the `/app/data` volume and runs as a non-root
user; it fails fast if `JWT_*` secrets are absent in production.

---

## 5. Migrations & seeding

Migrations are **forward-only, transactional, idempotent** (`backend/src/db/migrations/`)
and run automatically on boot when `DB_AUTO_MIGRATE=true`. To run them as a
standalone pre-deploy/release step:

```bash
cd backend
npm run build && npm run migrate     # prod: node dist/db/migrateCli.js
npm run migrate:dev                  # local, from TypeScript source
```

Seeding (`DB_AUTO_SEED=true`) populates reference data and **demo accounts with
publicly-known passwords** — intended for local/staging showcase only. Keep it
`false` on any instance holding real data.

> **Persistence note:** SQLite on an ephemeral filesystem (e.g. Render's free
> plan) resets on every deploy/restart. For durable data, attach a persistent
> disk (mount at `DATABASE_PATH`'s directory) or migrate to a networked DB.

---

## 6. Post-deploy verification

Run through this checklist against the live URLs:

- [ ] `GET <api>/healthz` returns `{"status":"ok"}`
- [ ] Homepage loads at the web URL
- [ ] Catalog (`/browse`) shows seeded releases — not blank
- [ ] Signup succeeds (create an account)
- [ ] No CORS errors in the browser console
- [ ] No failing network requests (DevTools → Network)
- [ ] Buy → resale flow works with a demo account (`demo@sniser.io` / `Password123`)

---

## 7. Quality gates (CI)

`.github/workflows/ci.yml` runs on every push/PR to `main`: **lint → typecheck →
test → build**, plus a Docker image build. Reproduce locally with:

```bash
npm run verify     # lint + typecheck + test + build (both packages)
```
