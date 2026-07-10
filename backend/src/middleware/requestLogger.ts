import { RequestHandler } from "express";
import { logger } from "../utils/logger";

/** Structured access log: one line per finished request. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const payload = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };
    if (res.statusCode >= 500) {
      logger.error(payload, "request");
    } else if (res.statusCode >= 400) {
      logger.warn(payload, "request");
    } else {
      logger.info(payload, "request");
    }
  });
  next();
};
