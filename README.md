# Sniser — Production-Ready Monorepo

A full-stack music marketplace for **Sniser**, built to enterprise-grade quality. Artists onboard, publish releases, and earn; fans fund a custodial wallet, buy access passes, and resell them on a secondary market. Includes email verification / password reset, a notifications feed, a contact desk, and an admin console — all localized in 4 languages (en / ar / fr / es, RTL-aware).

**Stack** — Frontend: React 18 + TypeScript + Tailwind + Framer Motion + Vite + i18next. Backend: Node + Express + TypeScript + Zod + Pino + Helmet + JWT + better-sqlite3. Tests: `node:test` + Supertest (backend), Vitest (frontend). Lint: ESLint 9 (flat config).

---

## Project structure

```
figma2/
├── frontend/                            # React + TS + Tailwind (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/                  # Container, Section, RootLayout, PageFallback
│   │   │   ├── shared/                  # Navbar, Footer, Button, Spinner, Skeleton,
│   │   │   │                            # IconButton, AnimateIn, Stagger, MediaFrame,
│   │   │   │                            # StepNumber, SectionHeading, WhatsAppButton,
│   │   │   │                            # Logo, Icons
│   │   │   ├── artist/                  # HeroArtist, CreateRecordRelease, StepsOverview,
│   │   │   │                            # HowItWorks*, TapIntoNetwork
│   │   │   └── viewer/                  # HeroViewer, ViewerStep*, PaymentMethods, FeaturesBar
│   │   ├── pages/                       # ArtistPage, ViewerPage (lazy-loaded)
│   │   ├── hooks/                       # usePageMeta, useScrolled, useLockBodyScroll, usePointerParallax
│   │   ├── lib/
│   │   │   ├── api/                     # client.ts, endpoints.ts, types.ts
│   │   │   └── motion/                  # MotionProvider (LazyMotion), variants
│   │   ├── config/                      # env.ts (type-safe VITE_* access)
│   │   ├── types/                       # shared TS types
│   │   ├── utils/                       # cn, constants
│   │   ├── App.tsx                      # router + route transitions
│   │   ├── main.tsx                     # entry (wraps App in MotionProvider)
│   │   └── index.css                    # tailwind layers + typography + a11y
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json / tsconfig.node.json
│   ├── vercel.json                      # Vercel deployment config
│   └── package.json
│
└── backend/                             # Node + Express + TS
    ├── src/
    │   ├── api/
    │   │   └── v1/                      # Versioned API namespace
    │   │       ├── index.ts             # v1 router aggregator
    │   │       └── health/              # Feature module
    │   │           ├── health.controller.ts
    │   │           ├── health.service.ts
    │   │           ├── health.routes.ts
    │   │           └── health.schema.ts
    │   ├── config/
    │   │   └── env.ts                   # Zod-validated env (fails fast)
    │   ├── middleware/
    │   │   ├── asyncHandler.ts
    │   │   ├── auth.ts                  # JWT requireAuth / optionalAuth / requireRole
    │   │   ├── errorHandler.ts          # Centralized error formatting
    │   │   ├── notFound.ts
    │   │   ├── rateLimit.ts             # apiLimiter / strictLimiter / factory
    │   │   ├── requestId.ts             # x-request-id correlation
    │   │   ├── requestLogger.ts         # Structured access logs (pino)
    │   │   ├── sanitize.ts              # Body sanitization
    │   │   └── validate.ts              # Generic zod validation middleware
    │   ├── utils/
    │   │   ├── ApiError.ts              # Typed error with factory helpers
    │   │   ├── ApiResponse.ts           # ok / fail / sendOk / sendCreated / sendPaginated
    │   │   └── logger.ts                # Pino logger (pretty in dev)
    │   ├── types/
    │   │   └── express.d.ts             # Request augmentation (req.id, req.user)
    │   ├── app.ts                       # Express app factory
    │   └── server.ts                    # Entry + graceful shutdown
    ├── .env.example
    ├── render.yaml                      # Render blueprint
    ├── Procfile                         # Railway / Heroku fallback
    ├── tsconfig.json
    └── package.json
```

---

## Quick start

### Prerequisites
- **Node.js ≥ 20** (`.nvmrc` files included in both projects)
- **npm 10+**

### 1. Frontend

```bash
cd frontend
cp .env.example .env       # Windows PowerShell: copy .env.example .env
npm install
npm run dev                # http://localhost:5173
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # Windows PowerShell: copy .env.example .env
npm install
npm run dev                # http://localhost:4000
```

Smoke test:

```bash
curl http://localhost:4000/healthz
curl http://localhost:4000/api/v1/health
curl 'http://localhost:4000/api/v1/health?verbose=true'
```

---

## Available scripts

### Root (`/`)
| Script               | Description                                              |
|----------------------|---------------------------------------------------------|
| `npm run dev`        | Run backend + frontend together (concurrently)          |
| `npm run build`      | Build both projects                                     |
| `npm run typecheck`  | Typecheck both projects                                 |
| `npm run lint`       | ESLint across the monorepo                              |
| `npm run test`       | Run backend + frontend test suites                      |
| `npm run verify`     | **lint → typecheck → test → build** (full quality gate) |

### Frontend (`/frontend`)
| Script              | Description                                  |
|---------------------|----------------------------------------------|
| `npm run dev`       | Vite dev server with HMR                     |
| `npm run build`     | Typecheck + production bundle to `dist/`     |
| `npm run preview`   | Serve the production bundle locally          |
| `npm run start`     | Alias of `preview` (used by some platforms)  |
| `npm run typecheck` | `tsc --noEmit` only                          |
| `npm run test`      | Vitest unit tests (run once)                 |
| `npm run clean`     | Delete `dist/`                               |

### Backend (`/backend`)
| Script               | Description                                  |
|----------------------|----------------------------------------------|
| `npm run dev`        | `tsx watch` — auto-reload on file changes    |
| `npm run build`      | Compile TS → `dist/`                         |
| `npm run start`      | Run compiled JS                              |
| `npm run start:prod` | Production entrypoint (used by Render)       |
| `npm run typecheck`  | `tsc --noEmit` only                          |
| `npm run test`       | `node:test` + Supertest integration suite    |
| `npm run clean`      | Delete `dist/`                               |

---

## Frontend architecture

### Layout primitives
- **`<Container size>`** — width-constrained, padded box (`sm | md | lg | xl | full`)
- **`<Section tone spacing>`** — vertical rhythm + brand tone (`dark | card | green | light`, `none | sm | md | lg`)
- **`<RootLayout>`** — page shell (skip-link → Navbar → main → Footer), shared across routes so chrome never re-mounts on navigation.

### Shared primitives (zero duplication)
- **`<MediaFrame src alt aspect priority>`** — single image component used in every hero, step, and CTA block. Lazy by default, eager + `fetchPriority="high"` for above-the-fold, shimmer placeholder until load, group-aware hover zoom.
- **`<StepNumber number variant>`** — single source of truth for numbered badges (`onDark` / `onAccent`).
- **`<Button isLoading>`** — built-in spinner, disabled while loading, `aria-busy`, `forwardRef`.

### Animations (Framer Motion + LazyMotion)
- **`<MotionProvider>`** wraps the app with `LazyMotion features={domAnimation} strict` — saves ~30 kB on the initial JS payload vs the full `motion` import.
- **`<AnimateIn variants delay>`** — scroll-triggered entrance.
- **`<StaggerContainer>` / `<StaggerItem>`** — staggered children.
- Shared variant library in `src/lib/motion/variants.ts` (`fadeUp`, `fadeIn`, `scaleIn`, `slideInLeft`, `slideInRight`, `staggerContainer`, `staggerItem`) — all using the `EASE_SOFT` curve.
- `MotionConfig reducedMotion="user"` honors OS-level reduced-motion preferences for *every* motion component automatically.
- Route transitions handled by `AnimatePresence` in `App.tsx`.

### Performance
- **Lazy routes** — `ViewerPage` is `React.lazy()`-loaded with a Suspense `PageFallback` skeleton, splitting it into its own chunk.
- **LazyMotion strict** — only domAnimation features ship initially.
- **Image optimization** — `loading="lazy"`, `decoding="async"`, `fetchPriority="high"` on hero images, shimmer placeholders, fade-in on load.

### Accessibility
- **Skip link** to `#main-content` in `RootLayout` (visible on focus).
- `role="banner"` on header, `role="contentinfo"` on footer, `role="main"` implicit on `<main>`.
- `aria-modal`, `aria-expanded`, `aria-controls` on the mobile drawer, with a **focus trap** (Tab is contained) and focus restored to the trigger on close.
- **Escape key** closes the mobile drawer.
- Focus-visible ring on every interactive element.
- Decorative icons marked `aria-hidden="true"`; functional icons have labels.
- Screen-reader-only step prefixes ("Step N:") for context.
- Reduced motion respected globally + via CSS media query.

### API integration
- **`env.apiUrl`** — read once in `src/config/env.ts`, never inline `import.meta.env`.
- **`lib/api/client.ts`** — fetch wrapper with timeout, abort, envelope unwrapping, typed errors (`ApiClientError`), and silent token refresh on `401` (de-duplicated across concurrent requests).
- **`lib/api/authToken.ts`** — the access token lives in a module variable (memory only); the refresh token is an httpOnly cookie. Nothing sensitive is ever written to `localStorage`.
- **`lib/api/endpoints.ts`** — typed endpoint registry. One function per backend resource.
- **`components/shared/SessionProvider.tsx`** — rehydrates the session on load and exposes `user` / `wallet` / auth actions to the tree.

```ts
import { endpoints } from "@/lib/api/endpoints";

const catalog = await endpoints.catalog.list({ category: "audio", sort: "newest" });
```

### Loading states
- `<Button isLoading loadingText="…">` — built-in spinner, disabled while loading, `aria-busy`.
- `<Spinner size="sm|md|lg">` — standalone loader.
- `<Skeleton variant="block|text|circle">` — pulse placeholder for content.
- `<PageFallback>` — full hero skeleton used by `Suspense` on lazy routes.

### Premium navbar
- Scroll-aware (shrinks at scroll > 8 px, blurs background).
- Animated SVG hamburger (lines morph to ✕).
- Mobile drawer with backdrop, staggered link reveal, body-scroll lock, Escape-to-close, auto-close on route change.
- Active-route highlight via `NavLink`.

---

## Backend architecture

### Versioning
All resource routes mounted under `/api/v1/…`. Add `/api/v2/…` later by creating `src/api/v2/index.ts` and mounting it from `app.ts` without touching v1.

### Middleware pipeline (order matters)
```
requestId → helmet → cors → json/urlencoded → sanitize → requestLogger
→ /healthz   (outside rate limit so probes are never throttled)
→ /api/* → apiLimiter → v1 router → notFound → errorHandler
```

### Response envelope
Every response uses one of:
```jsonc
// success
{ "success": true, "data": <T>, "meta": { "timestamp": "...", "requestId": "..." } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }, "meta": { ... } }
```
Helpers: `ok`, `fail`, `sendOk`, `sendCreated`, `sendPaginated`, `sendNoContent` in `utils/ApiResponse.ts`.

### Validation
Per-route zod schemas + a generic `validate({ body, query, params, headers })` middleware. Parsed values are written back onto the request, so controllers get typed payloads. Failures become `422 VALIDATION_ERROR` with structured `details`.

### Errors
Throw `ApiError.badRequest("…")`, `ApiError.notFound()`, `ApiError.unauthorized()`, `ApiError.forbidden()`, `ApiError.conflict()`, `ApiError.validation()`, or `ApiError.internal()`. The central `errorHandler` formats them and logs structured fields (status, code, requestId, path, method, stack).

### Logging
- **`utils/logger.ts`** — Pino logger, pretty-printed in dev, JSON in prod.
- **`middleware/requestLogger.ts`** — one structured line per finished request with method, url, status, durationMs, ip, requestId.
- Authorization & cookie headers automatically redacted (`req.headers.authorization`, `req.headers.cookie`, `*.password`).

### Rate limiting
`middleware/rateLimit.ts` exports three flavors backed by `express-rate-limit`:
- **`apiLimiter`** — applied to every `/api/*` request (window + max from env)
- **`strictLimiter`** — tighter limits for sensitive routes (login, password reset, payments)
- **`createRateLimiter(opts)`** — factory for ad-hoc per-route limits

Rate-limit responses use the standard envelope and include `retryAfterSeconds`.

### Request sanitization
`middleware/sanitize.ts` runs after body parsing — strips NUL bytes and trims string leaves. Defense-in-depth on top of zod schema validation.

### Auth (access + refresh tokens)
`middleware/auth.ts` exports:
- **`requireAuth`** — 401 if no/invalid bearer token; re-reads the user from the DB on every request (so role/suspension changes take effect immediately) and populates `req.user`
- **`optionalAuth`** — populates `req.user` if a valid token is present, silent otherwise
- **`requireRole(...roles)`** — 403 unless the user's role matches (`admin` is always allowed)

Sessions use **short-lived JWT access tokens** (`HS256`, algorithm-pinned on verify) plus **opaque, rotating refresh tokens** — only the SHA-256 hash of each refresh token is stored, and it is rotated on every use and revocable per-token or per-user (`services/session.ts`). Passwords are hashed with scrypt (`utils/password.ts`) and compared in constant time.

In development the API derives a deterministic dev-only secret so it boots zero-config. In **production, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (each ≥32 chars) are required** — the env schema fails fast at boot if either is missing.

### Environment validation
`config/env.ts` parses `process.env` through a zod schema at boot — invalid env exits the process with a readable error before the server starts.

### Adding a new module (auth example)

1. `src/api/v1/auth/`
   - `auth.schema.ts` — `loginBodySchema = z.object({ email: z.string().email(), password: z.string().min(8) })`
   - `auth.service.ts` — business logic / DB access
   - `auth.controller.ts` — thin handlers that call the service and `sendOk(res, …)`
   - `auth.routes.ts` — `router.post("/login", strictLimiter, validate({ body: loginBodySchema }), authController.login)`
2. `src/api/v1/index.ts` — `v1.use("/auth", authRoutes)`

Payments, artists, content, etc. follow the same pattern.

---

## Routes

Infrastructure:

| Path                            | Description                                            |
|---------------------------------|--------------------------------------------------------|
| `GET /`                         | Service descriptor                                     |
| `GET /healthz`                  | Liveness probe (plain `{ status: "ok" }`)              |
| `GET /api/v1`                   | API index                                              |
| `GET /api/v1/health`            | Service status (envelope-wrapped)                      |
| `GET /api/v1/health?verbose=1`  | Status + Node memory / version / platform              |

Resources (all under `/api/v1`):

| Prefix           | Highlights                                                                 |
|------------------|---------------------------------------------------------------------------|
| `/auth`          | signup, login, refresh, logout, me, verify-email, forgot/reset/change password |
| `/catalog`       | public listing (search/filter/sort/paginate), categories, trending, detail |
| `/artists`       | apply, self-manage profile + releases (create/update/status/delete), public profile |
| `/wallet`        | summary, transactions, deposit                                            |
| `/purchases`     | buy a pass, library, content access grant                                 |
| `/resale`        | list / cancel / buy secondary-market passes                               |
| `/notifications` | list, mark read                                                           |
| `/contact`       | submit a support/press/advertise ticket (honeypot-protected)              |
| `/users`         | account profile, avatar upload                                            |
| `/admin`         | stats, user management, tickets, audit log (admin-only)                   |

---

## Environment variables

### Frontend (`.env`)
| Variable             | Default                          | Description                          |
|----------------------|----------------------------------|--------------------------------------|
| `VITE_API_URL`       | `http://localhost:4000/api/v1`   | Base URL of the Sniser API           |
| `VITE_WHATSAPP_URL`  | `https://wa.me/447000000000`     | CTA destination                      |

### Backend (`.env`)
See `backend/.env.example` for the fully-commented reference. Key variables:

| Variable                | Default                  | Description                                  |
|-------------------------|--------------------------|----------------------------------------------|
| `NODE_ENV`              | `development`            | `development \| production \| test`          |
| `PORT`                  | `4000`                   | HTTP port                                    |
| `CORS_ORIGIN`           | `http://localhost:5173`  | Comma-separated allowed origins              |
| `API_PREFIX`            | `/api`                   | Versioned API mount prefix                   |
| `BODY_LIMIT`            | `1mb`                    | Request body size cap                        |
| `APP_URL`               | `http://localhost:5173`  | Public SPA URL (used to build email links)   |
| `LOG_LEVEL`             | `info`                   | `fatal \| error \| warn \| info \| debug \| trace` |
| `RATE_LIMIT_WINDOW_MS`  | `900000` (15 min)        | Rate-limit window                            |
| `RATE_LIMIT_MAX`        | `300`                    | Max requests per window per IP               |
| `DATABASE_PATH`         | `./data/sniser.db`       | SQLite file location                         |
| `DB_AUTO_MIGRATE`       | `true`                   | Run migrations on boot                       |
| `DB_AUTO_SEED`          | `true` (dev) / `false` (prod) | Seed demo data — **off in production** (demo accounts use public passwords) |
| `JWT_ACCESS_SECRET`     | _(dev fallback)_         | ≥32-char secret. **Required in production.** |
| `JWT_REFRESH_SECRET`    | _(dev fallback)_         | ≥32-char secret. **Required in production.** |
| `JWT_ACCESS_TTL`        | `15m`                    | Access token lifetime                        |
| `REFRESH_TTL_DAYS`      | `30`                     | Refresh token lifetime (days)                |
| `PLATFORM_FEE_BPS`      | `250`                    | Primary-sale fee (basis points; 250 = 2.5%)  |
| `RESALE_FEE_BPS`        | `500`                    | Resale commission (basis points; 500 = 5%)   |
| `MAX_DEPOSIT`           | `10000`                  | Max wallet top-up per request                |
| `SMTP_*`                | _(unset)_                | SMTP config; falls back to a file outbox     |
| `ADMIN_EMAIL`           | `admin@sniser.io`        | Bootstrap admin email                        |
| `ADMIN_PASSWORD`        | `ChangeMe!2026`          | Bootstrap admin password — **change in prod** |

---

## Testing & quality gates

Run the whole gate from the repo root:

```bash
npm run verify        # lint → typecheck → test → build (both projects)
```

Or piecemeal: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

- **Backend** — `node:test` + Supertest. Each file boots the real Express app against an isolated temp SQLite database. Suites cover money math, auth (signup/login/refresh/me, duplicate-email, weak-password, no user enumeration, tampered tokens), authorization + IDOR (admin gating, cross-artist isolation), security headers, the full **purchase → resale** money flow (fee math, overdraft rejection, self-purchase guard, commission split), and marketplace **invariants** (resale never consumes primary supply, supply enforced at the cap, free releases acquirable, re-list-after-cancel, sub-cent amounts rejected cleanly).
- **Frontend** — Vitest unit tests for the pure logic: form validators, URL/scheme safety (`isUnsafeHref` XSS guard), the locale-routing helpers, and the API client's envelope handling (204/empty bodies, non-JSON gateway errors, typed error codes).
- **Lint** — ESLint 9 flat config (`eslint.config.mjs`): typescript-eslint recommended + `react-hooks` rules, Node vs browser globals per project.
- **Types** — `tsc` in `strict` mode with `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns`.

---

## Deployment

The frontend and backend deploy **independently** — each has its own `package.json`, `engines`, build, and start scripts.

### 🚀 Frontend on Vercel

1. **Push to GitHub.**
2. In Vercel: **New Project → Import** the repo.
3. **Root Directory:** `frontend`.
4. **Framework Preset:** Vite (auto-detected).
5. **Environment Variables:**
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api/v1`
6. Deploy. `vercel.json` is included and handles SPA rewrites + security headers + asset caching.

CLI alternative:
```bash
cd frontend
npx vercel deploy --prod
```

### 🚀 Backend on Render

**Option A — Blueprint (one-click):**
1. Push to GitHub.
2. In Render: **New → Blueprint → Connect repo**. Render reads `backend/render.yaml`.
3. Set `CORS_ORIGIN` and `APP_URL` in the Render dashboard to your Vercel URL (e.g. `https://sniser.vercel.app`).
4. `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_PASSWORD` are auto-generated by Render via `generateValue: true`; `DB_AUTO_SEED` is `false` in production.
5. Deploy. Health check at `/healthz` is wired automatically. **Note:** Render's free plan has an ephemeral filesystem, so the SQLite DB resets on each deploy — attach a persistent disk for durable data.

**Option B — Manual web service:**
1. **New → Web Service** → connect repo.
2. **Root Directory:** `backend`.
3. **Build Command:** `npm ci && npm run build`
4. **Start Command:** `npm run start:prod`
5. **Health Check Path:** `/healthz`
6. **Env vars:** `NODE_ENV=production`, `PORT=10000`, `CORS_ORIGIN=https://<your-vercel-url>`, `LOG_LEVEL=info`.

### 🚂 Backend on Railway

1. **New Project → Deploy from GitHub** → pick the repo.
2. Set **Root Directory** to `backend`.
3. Railway picks up `Procfile` (`web: npm run start:prod`).
4. **Build Command:** `npm ci --include=dev && npm run build && npm prune --omit=dev`
   (the `--include=dev` flag is required so `tsc` is available during build when `NODE_ENV=production`).
5. Add env vars (same as Render).
6. Add a public domain in the Networking tab.

### Connecting frontend → backend

After both services are deployed:
1. Copy the backend URL (e.g. `https://sniser-api.onrender.com`).
2. On Vercel, set `VITE_API_URL` to `https://sniser-api.onrender.com/api/v1` and redeploy the frontend.
3. On the backend, set `CORS_ORIGIN` to your Vercel URL (no trailing slash). Multiple origins comma-separated.

---

## Design system tokens

Defined in `frontend/tailwind.config.js`:

| Token              | Hex        | Role                              |
|--------------------|------------|-----------------------------------|
| `brand-green`      | `#A6E84D`  | Primary brand color, CTAs         |
| `brand-greenDark`  | `#8BCB35`  | Hover for green                   |
| `bg`               | `#1C1F24`  | Page background                   |
| `bg-card`          | `#262A30`  | Cards on dark bg                  |
| `bg-soft`          | `#2D3239`  | Hovered cards                     |
| `bg-light`         | `#F4F4F1`  | Light alternating section         |
| `bg-ink`           | `#0F1115`  | Pressed / deepest                 |

Type tokens: `text-hero` (clamp 2.5rem → 4.25rem), `text-display` (clamp 2rem → 3rem).
Easing: `ease-out-soft` = `cubic-bezier(0.22, 1, 0.36, 1)`.
Keyframes: `fade-up`, `fade-in`, `scale-in`, `shimmer`, `pulse-soft`.

---

## Production checklist (shipped)

### Backend
- ✅ Strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- ✅ Zod env validation — server fails fast on misconfiguration
- ✅ Helmet security headers, `x-powered-by` disabled
- ✅ CORS allowlist with envelope-wrapped errors
- ✅ Body size limits + JSON `strict` mode (DoS hardening)
- ✅ Body sanitization (NUL strip + trim)
- ✅ Rate limiting on `/api/*` with envelope responses
- ✅ JWT auth scaffold (requireAuth / optionalAuth / requireRole / signAccessToken)
- ✅ Structured Pino logging + per-request correlation ids (`x-request-id`)
- ✅ Sensitive headers automatically redacted
- ✅ Centralized error pipeline with typed `ApiError` codes
- ✅ Graceful shutdown on SIGTERM/SIGINT
- ✅ Liveness probe at `/healthz` (excluded from rate limit)
- ✅ Trust-proxy enabled in prod (correct `req.ip` behind Render/Railway)

### Frontend
- ✅ Strict TypeScript (same flags)
- ✅ LazyMotion strict mode (~30 kB saved vs full framer-motion)
- ✅ Route-level code splitting (Viewer page lazy-loaded)
- ✅ Image lazy loading + decoding=async + fetchPriority on heroes
- ✅ Shimmer placeholders + fade-in on image load
- ✅ Skip-to-content link
- ✅ Focus-visible rings on every interactive element
- ✅ Mobile drawer: aria-modal, Escape-to-close, body-scroll lock
- ✅ `prefers-reduced-motion` respected via MotionConfig + CSS @media
- ✅ SPA rewrites + long-cache headers + security headers via `vercel.json`
- ✅ Engines + `.nvmrc` pin Node 20

### Deployment
- ✅ Frontend and backend deploy independently
- ✅ Vercel SPA config (rewrites, headers, cache)
- ✅ Render blueprint (auto-generate JWT secret, healthcheck path)
- ✅ Railway-compatible `Procfile`
- ✅ Production scripts (`start:prod`, `preview`, `build`)
- ✅ No secrets committed (only `.env.example`)

---

## Notes on the design conversion

- Images use Unsplash placeholders so the UI is fully runnable with no asset import. Drop your real Figma exports into `frontend/src/assets/` and `import` them in the corresponding section component.
- Colors, spacing, and typography were sampled from the provided Figma screenshots and kept fixed across breakpoints — only the layout reflows on tablet/mobile.
- The two pages share `Navbar` and `Footer` via the `RootLayout` shell. The "Explore Content" link in the navbar routes to `/viewer`.
