import rateLimit, { Options } from "express-rate-limit";
import { env } from "../config/env";
import { fail } from "../utils/ApiResponse";

const COMMON: Partial<Options> = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Skip rate-limit headaches inside the test suite
  skip: () => env.isTest,
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json(
      fail("TOO_MANY_REQUESTS", "Too many requests — please try again later.", undefined, {
        requestId: req.id,
        retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      })
    );
  },
};

/** Default limiter applied to every /api/* request. */
export const apiLimiter = rateLimit({
  ...COMMON,
  max: env.RATE_LIMIT_MAX,
});

/** Tighter limiter for sensitive endpoints (auth, payments, password reset). */
export const strictLimiter = rateLimit({
  ...COMMON,
  windowMs: 5 * 60 * 1000,
  max: 10,
});

/** Factory for ad-hoc per-route limits. */
export function createRateLimiter(opts: Partial<Options>) {
  return rateLimit({ ...COMMON, ...opts });
}
