import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp?: string;
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ResponseMeta;
}

function withTimestamp(meta?: ResponseMeta): ResponseMeta {
  return { timestamp: new Date().toISOString(), ...(meta ?? {}) };
}

/** Build a success envelope (does not send). */
export function ok<T>(data: T, meta?: ResponseMeta): SuccessEnvelope<T> {
  return { success: true, data, meta: withTimestamp(meta) };
}

/** Build an error envelope (does not send). */
export function fail(
  code: string,
  message: string,
  details?: unknown,
  meta?: ResponseMeta
): ErrorEnvelope {
  return {
    success: false,
    error: { code, message, details },
    meta: withTimestamp(meta),
  };
}

/** Send a success envelope. */
export function sendOk<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: ResponseMeta
): Response {
  const requestId = res.req?.id;
  return res
    .status(status)
    .json(ok(data, { ...(meta ?? {}), ...(requestId ? { requestId } : {}) }));
}

/** Send a paginated success envelope. */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  status = 200
): Response {
  return sendOk(res, data, status, { pagination });
}

/** Send a 201 Created envelope. */
export function sendCreated<T>(res: Response, data: T): Response {
  return sendOk(res, data, 201);
}

/** Send a 204 No Content (no body). */
export function sendNoContent(res: Response): Response {
  return res.status(204).end();
}
