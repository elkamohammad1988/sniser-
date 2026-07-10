import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { db } from "../db";
import { env } from "../config/env";
import { uuid } from "../utils/ids";
import { generateToken, hashToken } from "../utils/tokens";
import { addDays, nowIso } from "../utils/datetime";
import { ApiError } from "../utils/ApiError";
import { writeAudit } from "./audit";
import type { UserRow } from "./users";
import type { AuthUser } from "../types/express";

/**
 * Session issuance. Access = short-lived JWT (stateless, carries id/email/role).
 * Refresh = opaque random token, only its hash stored, rotated on every use and
 * revocable per-token or per-user.
 */

export function signAccessToken(user: Pick<UserRow, "id" | "email" | "role">): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.accessSecret,
    { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"], algorithm: "HS256" }
  );
}

export function verifyAccessToken(token: string): AuthUser {
  try {
    // Pin the algorithm so a token forged with `alg: none` (or an asymmetric
    // algorithm) can never be accepted by algorithm confusion.
    const payload = jwt.verify(token, env.accessSecret, { algorithms: ["HS256"] }) as JwtPayload;
    if (!payload.sub || typeof payload.sub !== "string") {
      throw new Error("missing subject");
    }
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    };
  } catch (err) {
    throw ApiError.unauthorized(
      err instanceof Error ? err.message : "Invalid or expired token"
    );
  }
}

export interface RefreshContext {
  ip?: string | null;
  userAgent?: string | null;
}

export interface IssuedRefresh {
  token: string;
  expiresAt: Date;
}

export function issueRefreshToken(userId: string, ctx: RefreshContext): IssuedRefresh {
  const { token, hash } = generateToken(48);
  const expiresAt = addDays(env.REFRESH_TTL_DAYS);
  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip, created_at)
     VALUES (@id, @userId, @hash, @expiresAt, @ua, @ip, @createdAt)`
  ).run({
    id: uuid(),
    userId,
    hash,
    expiresAt: expiresAt.toISOString(),
    ua: ctx.userAgent ?? null,
    ip: ctx.ip ?? null,
    createdAt: nowIso(),
  });
  return { token, expiresAt };
}

interface RefreshRow {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
}

/** Validate a refresh token and rotate it (revoke old, issue new). */
export function rotateRefreshToken(
  presented: string,
  ctx: RefreshContext
): { userId: string; refresh: IssuedRefresh } {
  const hash = hashToken(presented);
  const row = db
    .prepare("SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?")
    .get(hash) as RefreshRow | undefined;

  if (!row) {
    throw ApiError.unauthorized("Session expired — please sign in again");
  }

  // Reuse detection: a token that was already revoked (by an earlier rotation or
  // a logout) is being presented again. Under refresh-token rotation this is the
  // classic signature of a stolen token — the legitimate client already spent
  // this one. Contain the blast radius by revoking EVERY session for the user so
  // an attacker holding a rotated copy can't keep refreshing, and record it.
  if (row.revoked_at) {
    revokeAllForUser(row.user_id);
    writeAudit({
      actorId: row.user_id,
      action: "auth.refresh_reuse_detected",
      targetType: "user",
      targetId: row.user_id,
      ip: ctx.ip ?? null,
    });
    throw ApiError.unauthorized("Session revoked — please sign in again");
  }

  if (Date.parse(row.expires_at) < Date.now()) {
    throw ApiError.unauthorized("Session expired — please sign in again");
  }

  db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?").run(nowIso(), row.id);
  const refresh = issueRefreshToken(row.user_id, ctx);
  return { userId: row.user_id, refresh };
}

export function revokeRefreshToken(presented: string): void {
  db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL").run(
    nowIso(),
    hashToken(presented)
  );
}

export function revokeAllForUser(userId: string): void {
  db.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").run(
    nowIso(),
    userId
  );
}
