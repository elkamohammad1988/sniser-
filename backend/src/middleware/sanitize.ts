import { RequestHandler } from "express";

/**
 * Defence-in-depth body sanitizer. Strips NUL bytes and trims surrounding
 * whitespace on all string leaves of `req.body`. Runs after the JSON parser
 * but before request validation, so zod schemas see normalized input.
 *
 * Schema-level validation remains the source of truth for shape and content.
 */

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\0/g, "").trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeValue(v);
    }
    return out;
  }
  return value;
}

export const sanitize: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
