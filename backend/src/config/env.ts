import path from "node:path";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

/**
 * A dev-only fallback secret. In production the schema *requires* real secrets
 * (see `.superRefine` below), so this is only ever used on localhost to keep
 * the developer experience zero-config. It is deterministic per-process only
 * as a last resort; prefer setting the real env vars.
 */
function devSecret(label: string): string {
  return crypto
    .createHash("sha256")
    .update(`sniser-dev-${label}`)
    .digest("hex");
}

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === "true" || v === "1");

const EnvSchema = z
  .object({
    // Runtime
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),

    // HTTP
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    API_PREFIX: z.string().default("/api"),
    BODY_LIMIT: z.string().default("1mb"),

    /** Public URL of the SPA — used to build links in emails. */
    APP_URL: z.string().url().default("http://localhost:5173"),
    /** Public URL of this API — used to build absolute upload URLs. */
    PUBLIC_API_URL: z.string().url().optional(),

    // Logging
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    // Rate limiting (applied to /api/*)
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

    // Database
    DATABASE_PATH: z.string().default("./data/sniser.db"),
    /** Run migrations automatically on boot. */
    DB_AUTO_MIGRATE: boolish.default("true"),
    /**
     * Seed reference data (artists, catalog, admin) if the DB is empty. Left
     * unset it defaults to ON outside production and OFF in production, because
     * the demo accounts use publicly documented passwords. Set explicitly to
     * override either way.
     */
    DB_AUTO_SEED: boolish.optional(),

    // Auth — JWT access tokens (short-lived) + opaque refresh tokens (in DB).
    JWT_ACCESS_SECRET: z.string().min(32).optional(),
    JWT_REFRESH_SECRET: z.string().min(32).optional(),
    JWT_ACCESS_TTL: z.string().default("15m"),
    /** Refresh token lifetime in days. */
    REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

    // Cookies
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: boolish.optional(),

    // Email (falls back to a file/console outbox when SMTP is not configured)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: boolish.optional(),
    MAIL_FROM: z.string().default("Sniser <no-reply@sniser.io>"),
    MAIL_OUTBOX_DIR: z.string().default("./data/outbox"),

    // Uploads
    UPLOAD_DIR: z.string().default("./data/uploads"),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().default(15),

    // Marketplace economics (basis points; 250 = 2.5%)
    PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(250),
    RESALE_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(500),
    /** Max wallet top-up per request, in whole currency units. */
    MAX_DEPOSIT: z.coerce.number().int().positive().default(10_000),

    // Bootstrap admin (seeded once if the users table is empty)
    ADMIN_EMAIL: z.string().email().default("admin@sniser.io"),
    ADMIN_PASSWORD: z.string().min(8).default("ChangeMe!2026"),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production") {
      if (!val.JWT_ACCESS_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_ACCESS_SECRET"],
          message: "JWT_ACCESS_SECRET (≥32 chars) is required in production",
        });
      }
      if (!val.JWT_REFRESH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_REFRESH_SECRET"],
          message: "JWT_REFRESH_SECRET (≥32 chars) is required in production",
        });
      }
    }
  });

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "[env] Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

const data = parsed.data;

// Warn loudly if a production deployment is about to boot with the documented
// default admin password. (The schema can't hard-fail here without breaking the
// zero-config demo experience, so this is a prominent runtime guard instead.)
if (data.NODE_ENV === "production" && data.ADMIN_PASSWORD === "ChangeMe!2026") {
  // eslint-disable-next-line no-console
  console.warn(
    "[env] WARNING: ADMIN_PASSWORD is still the default value in production. " +
      "Set a strong ADMIN_PASSWORD before exposing this deployment."
  );
}

const resolveAbs = (p: string) => (path.isAbsolute(p) ? p : path.resolve(process.cwd(), p));

export const env = {
  ...data,
  // Seed demo data by default everywhere except production (opt-in there).
  DB_AUTO_SEED: data.DB_AUTO_SEED ?? !isProd,
  // Back-compat alias used by the JWT scaffold / docs.
  JWT_SECRET: data.JWT_ACCESS_SECRET,
  JWT_EXPIRES_IN: data.JWT_ACCESS_TTL,

  accessSecret: data.JWT_ACCESS_SECRET ?? devSecret("access"),
  refreshSecret: data.JWT_REFRESH_SECRET ?? devSecret("refresh"),

  databaseFile: resolveAbs(data.DATABASE_PATH),
  uploadDir: resolveAbs(data.UPLOAD_DIR),
  outboxDir: resolveAbs(data.MAIL_OUTBOX_DIR),

  corsOrigins: data.CORS_ORIGIN.split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  cookieSecure: data.COOKIE_SECURE ?? isProd,
  smtpConfigured: Boolean(data.SMTP_HOST && data.SMTP_PORT),

  isDev: data.NODE_ENV === "development",
  isProd: data.NODE_ENV === "production",
  isTest: data.NODE_ENV === "test",
} as const;

export type Env = typeof env;
