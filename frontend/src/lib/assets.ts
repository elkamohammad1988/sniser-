import { env } from "../config/env";

/**
 * Resolve a possibly-relative upload path (e.g. `/uploads/covers/x.jpg`) to an
 * absolute URL against the API origin. Absolute URLs and data URIs pass through
 * unchanged. Returns null for empty input so callers can fall back to art.
 */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${env.apiOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
}
