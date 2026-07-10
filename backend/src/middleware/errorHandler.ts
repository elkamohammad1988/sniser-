import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { ApiError } from "../utils/ApiError";
import { fail } from "../utils/ApiResponse";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof ZodError) {
    apiError = ApiError.validation("Validation failed", err.issues);
  } else if (err instanceof SyntaxError && "body" in err) {
    apiError = ApiError.badRequest("Malformed JSON body");
  } else {
    apiError = ApiError.internal(
      env.isProd ? "Internal server error" : (err as Error)?.message ?? "Unknown error"
    );
  }

  const logPayload = {
    requestId: req.id,
    status: apiError.status,
    code: apiError.code,
    message: apiError.message,
    path: req.originalUrl,
    method: req.method,
    stack: env.isProd ? undefined : (err as Error)?.stack,
  };

  if (apiError.status >= 500) {
    logger.error(logPayload, "request failed");
  } else {
    logger.warn(logPayload, "request rejected");
  }

  res.status(apiError.status).json(
    fail(apiError.code, apiError.message, apiError.details, {
      requestId: req.id,
    })
  );
};
