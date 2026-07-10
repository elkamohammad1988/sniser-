import type { PaginationMeta } from "./ApiResponse";

export interface PageParams {
  page: number;
  pageSize: number;
  offset: number;
}

/** Clamp/normalize incoming page + pageSize into safe bounds. */
export function resolvePage(
  page: unknown,
  pageSize: unknown,
  maxPageSize = 60,
  defaultPageSize = 12
): PageParams {
  const p = Math.max(1, Math.floor(Number(page) || 1));
  const raw = Math.floor(Number(pageSize) || defaultPageSize);
  const size = Math.min(maxPageSize, Math.max(1, raw));
  return { page: p, pageSize: size, offset: (p - 1) * size };
}

export function paginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
