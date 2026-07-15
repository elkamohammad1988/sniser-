# Sniser — Engineering Case Study

> A full-stack music marketplace: artists publish releases, fans fund a custodial
> wallet and buy access passes, then resell them on a secondary market.
> Built solo, production-grade, in TypeScript end to end.
>
> **Live demo:** _<add Vercel URL after deploy>_ · **Repo:** github.com/elkamohammad1988/sniser-
> **Demo logins:** `demo@sniser.io` / `Password123` (fan) · `collector@sniser.io` / `Password123` (resale)

---

## The problem

Independent artists sell access to exclusive drops, but the tools split the job:
Bandcamp handles the storefront, Patreon handles recurring access, resale doesn't
exist at all. Sniser is a single system that does primary sale **and** a
peer-to-peer resale market on top of a custodial wallet — the artist earns on the
first sale, and again on every resale via a platform commission.

The engineering problem this creates: money movement, ownership transfer, and
paid content protection all have to be correct and abuse-resistant, while the
front end stays fast, localized, and accessible.

## My role

Sole engineer — product, backend, frontend, auth, payments logic, i18n,
accessibility, and deployment. Stack chosen for correctness and zero-config
portability over fashionable infrastructure.

## Architecture at a glance

| Layer | Choices | Why |
|---|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind · Framer Motion · i18next | Fast builds, type-safe UI, design-token system, 4 languages incl. RTL |
| Backend | Node · Express · TypeScript · Zod · Pino · Helmet · JWT | Small, explicit, auditable; validation and security as first-class layers |
| Data | better-sqlite3 (synchronous SQLite) | Zero-config, transactional, portable — the whole DB is one file |
| Tests | `node:test` + Supertest (API) · Vitest (frontend) | Real HTTP-level API tests, not mocks |

## Decisions that were actually hard

**1. Money is integer basis points, never floats.**
Platform fee (2.5%) and resale commission (5%) are stored as basis points
(`PLATFORM_FEE_BPS=250`, `RESALE_FEE_BPS=500`) and applied with integer math.
Floating-point currency is a classic source of off-by-a-cent bugs and
reconciliation drift; basis points make every fee exact and auditable.

**2. Paid content is never served statically.**
Covers and avatars are public static files. But exclusive drop media (the thing a
fan actually pays for) is ownership-gated: it streams only through a token-checked,
`Range`-capable `/media` route, and the public `/uploads/media/*` path is
explicitly 404'd *before* the static handler. This closes the "guess the URL, get
the paid file for free" hole that most demo marketplaces leave open.

**3. Security is configured, not assumed.**
- Helmet with a deliberately restrictive CSP (a JSON API serves no HTML, so
  `default-src 'none'`), HSTS in production only so localhost stays on http.
- CORS is an env-driven origin allowlist with a per-request callback, not `*`.
- Rate limiting scoped to `/api/*`, with health probes deliberately left
  unthrottled so uptime checks don't trip the limiter.
- Env is validated by a Zod schema that **hard-fails the boot** in production if
  the JWT access/refresh secrets are missing — you cannot accidentally ship
  insecure. Dev gets deterministic fallback secrets so it stays zero-config.
- Auth is short-lived JWT access tokens + opaque refresh tokens with silent
  refresh-and-retry on the client.

**4. Internationalization and accessibility were built in, not bolted on.**
Four locales (en / ar / fr / es), RTL-aware. The mobile nav is a real dialog:
focus trap, `Escape` to close, focus restoration to the trigger, `aria-modal`,
and a global `prefers-reduced-motion` guard that neutralizes every animation.

**5. A design system, not ad-hoc styling.**
Fluid `clamp()` typography that scales with the viewport, a tokenized color /
border / elevation scale, custom easing curves, and a zero-dependency inline SVG
icon set — no icon library shipped to users.

## What's demo vs production (honest)

- **Custodial wallet is simulated** — top-ups are recorded, not settled through a
  real PSP. Wiring Stripe/PayPal is a swap at the payments boundary, not a rewrite.
- **SQLite on the free host is ephemeral** — the demo DB reseeds on each deploy.
  Durable data means attaching a persistent disk or moving to Postgres; the data
  layer is isolated behind a thin repository so the swap is contained.
- Everything else — auth, catalog, purchase, resale, wallet, admin console,
  i18n, email verification / password reset — runs the real code paths.

## What this demonstrates

Correct money handling, real access control on paid content, security configured
to production standards, and a localized, accessible, responsive front end — all
delivered end to end by one engineer in TypeScript. The kind of system where the
hard parts are the invisible ones.
