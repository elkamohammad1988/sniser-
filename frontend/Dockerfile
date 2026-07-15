# syntax=docker/dockerfile:1

##
## Sniser web (SPA) — build with Vite, serve the static bundle with nginx.
## VITE_API_URL is inlined at BUILD time (Vite bakes import.meta.env into the
## bundle), so it is a build arg, not a runtime environment variable.
##

# ---- Stage 1: build ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:4000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Stage 2: serve ----
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
