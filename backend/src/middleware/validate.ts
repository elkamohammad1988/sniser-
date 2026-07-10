import { RequestHandler } from "express";
import { ZodError, ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

function formatZodIssues(err: ZodError) {
  return err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Validate request body / query / params / headers against zod schemas.
 * Parsed (and coerced) values are assigned back onto the request so
 * downstream controllers receive the typed payload.
 */
export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query) as Record<string, unknown>;
        // req.query is mutable in Express 4 — overwrite via assign
        Object.keys(req.query).forEach((k) => delete (req.query as Record<string, unknown>)[k]);
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params) as Record<string, unknown>;
        Object.assign(req.params, parsed);
      }
      if (schemas.headers) schemas.headers.parse(req.headers);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(ApiError.validation("Validation failed", formatZodIssues(err)));
        return;
      }
      next(err);
    }
  };
