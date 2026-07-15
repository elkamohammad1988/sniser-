import fs from "node:fs";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { logger } from "./utils/logger";
import { sendOk } from "./utils/ApiResponse";
import { ApiError } from "./utils/ApiError";

import { requestId } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { sanitize } from "./middleware/sanitize";
import { apiLimiter } from "./middleware/rateLimit";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

import v1 from "./api/v1";
import mediaRouter from "./api/media";

export function createApp(): Application {
  const app = express();

  // Hide implementation hints.
  app.disable("x-powered-by");
  app.set("etag", "strong");

  // Trust the first hop proxy in production so req.ip / rate-limit work.
  if (env.isProd) app.set("trust proxy", 1);

  // 1. Correlation id — first so every later log/response can include it.
  app.use(requestId);

  // 2. Security headers + transport hardening.
  //    CSP for a JSON API is intentionally restrictive: no script/style/img
  //    sources at all (the API never serves HTML). HSTS is only set in prod
  //    so localhost http:// development keeps working.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          "default-src": ["'none'"],
          "frame-ancestors": ["'none'"],
          "base-uri": ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "no-referrer" },
      hsts: env.isProd
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
    })
  );

  // 3. Gzip compression for payloads above 1 KB. Skipped when the client
  //    opts out (`x-no-compression`) — handy for streaming endpoints later.
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    })
  );

  // 4. CORS — env-driven origin allowlist.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser tools (curl, server-to-server, health probes).
        if (!origin) return callback(null, true);
        if (env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(ApiError.forbidden(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      maxAge: 86400,
    })
  );

  // 5. Body + cookie parsers (with strict limits to thwart payload-bomb DoS).
  app.use(express.json({ limit: env.BODY_LIMIT, strict: true }));
  app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
  app.use(cookieParser());

  // 6. Defense-in-depth sanitization (runs on parsed body).
  app.use(sanitize);

  // 7. Structured access logging.
  if (!env.isTest) app.use(requestLogger);

  // 8. Liveness/readiness probes — outside the versioned API and below the
  //    rate-limiter so platforms can poll without being throttled. Body is
  //    intentionally minimal: probes parse plain JSON, not the envelope.
  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });
  app.get("/", (_req: Request, res: Response) => {
    sendOk(res, { name: "Sniser API", versions: ["v1"], status: "live" });
  });

  // 9. Static uploads (covers/avatars). Served with a long cache and a
  //    cross-origin resource policy so the SPA on another origin can load them.
  fs.mkdirSync(env.uploadDir, { recursive: true });
  // Exclusive drop media is NEVER served statically — it is paid, ownership-
  // gated content. It streams only through the token-checked /media route
  // below. This guard (registered before the static handler) closes the public
  // `/uploads/media/*` hole; covers and avatars stay public.
  app.use("/uploads/media", (_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
  });
  app.use(
    "/uploads",
    express.static(env.uploadDir, {
      maxAge: "7d",
      immutable: true,
      index: false,
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    })
  );

  // 9b. Token-gated media streaming (Range-capable). Outside the /api prefix so
  //     seek-heavy playback isn't throttled by the API rate limiter.
  app.use("/media", mediaRouter);

  // 10. Rate limiting — applied only to versioned API routes.
  app.use(env.API_PREFIX, apiLimiter);

  // 11. Versioned API.
  app.use(`${env.API_PREFIX}/v1`, v1);

  // 12. 404 + central error handler (must be last).
  app.use(notFound);
  app.use(errorHandler);

  logger.debug(
    {
      corsOrigins: env.corsOrigins,
      prefix: `${env.API_PREFIX}/v1`,
      env: env.NODE_ENV,
      rateLimit: { windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX },
    },
    "app initialized"
  );

  return app;
}
