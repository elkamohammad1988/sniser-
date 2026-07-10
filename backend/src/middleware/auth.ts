import { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../services/session";
import { findUserById } from "../services/users";

/**
 * Access-token auth. `requireAuth` rejects missing/invalid tokens; `optionalAuth`
 * populates `req.user` when a valid token is present and is otherwise silent.
 * `requireRole` gates by the user's single role, with `admin` always allowed.
 */

const BEARER = /^Bearer\s+(.+)$/i;

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = BEARER.exec(authHeader.trim());
  return match?.[1] ?? null;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.header("authorization"));
  if (!token) return next(ApiError.unauthorized("Missing bearer token"));
  try {
    const user = verifyAccessToken(token);
    // Confirm the account still exists and is active on every request.
    const row = findUserById(user.id);
    if (!row) return next(ApiError.unauthorized("Account no longer exists"));
    if (row.status === "suspended") return next(ApiError.forbidden("Account suspended"));
    req.user = { id: row.id, email: row.email, role: row.role };
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.header("authorization"));
  if (!token) return next();
  try {
    const user = verifyAccessToken(token);
    const row = findUserById(user.id);
    if (row && row.status === "active") {
      req.user = { id: row.id, email: row.email, role: row.role };
    }
  } catch {
    // Optional auth: silently ignore invalid tokens.
  }
  next();
};

export const requireRole =
  (...roles: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    const role = req.user.role;
    if (role === "admin" || (role && roles.includes(role))) return next();
    next(ApiError.forbidden("Insufficient permissions"));
  };

// Re-export for existing imports / documentation parity.
export { signAccessToken } from "../services/session";
