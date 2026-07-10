import { randomUUID } from "crypto";
import { RequestHandler } from "express";

const HEADER = "x-request-id";

/** Attach a correlation id to every request (re-uses incoming header when present). */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header(HEADER);
  const id = incoming && incoming.length > 0 ? incoming : randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
};
