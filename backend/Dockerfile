# syntax=docker/dockerfile:1

##
## Sniser API — multi-stage production image.
## Stage 1 compiles TypeScript (and any native addons); stage 2 ships only the
## pruned runtime, so the final image carries no build toolchain.
##

# ---- Stage 1: build ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Toolchain for better-sqlite3's native addon (used only if no prebuilt binary
# matches this platform). It never reaches the final image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install against the lockfile first, for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Compile to dist/, then drop dev dependencies from node_modules.
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Stage 2: runtime ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=10000 \
    DATABASE_PATH=/app/data/sniser.db \
    UPLOAD_DIR=/app/data/uploads \
    MAIL_OUTBOX_DIR=/app/data/outbox
WORKDIR /app

# Run unprivileged; give the user ownership of the writable data directory.
RUN useradd --system --uid 10001 --create-home sniser \
  && mkdir -p /app/data \
  && chown -R sniser:sniser /app

COPY --from=builder --chown=sniser:sniser /app/node_modules ./node_modules
COPY --from=builder --chown=sniser:sniser /app/dist ./dist
COPY --from=builder --chown=sniser:sniser /app/package.json ./package.json

USER sniser
EXPOSE 10000

# Durable state (SQLite db, uploads, mail outbox) lives on a mounted volume.
VOLUME ["/app/data"]

# Container liveness — hits the app's own health endpoint (Node 20 ships fetch).
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||10000)+'/healthz').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

# Migrations run on boot (DB_AUTO_MIGRATE defaults true); then the API serves.
CMD ["node", "dist/server.js"]
