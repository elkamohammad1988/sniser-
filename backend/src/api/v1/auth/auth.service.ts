import { db, transaction } from "../../../db";
import { uuid } from "../../../utils/ids";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { generateToken, hashToken } from "../../../utils/tokens";
import { addMinutes, nowIso } from "../../../utils/datetime";
import { ApiError } from "../../../utils/ApiError";
import { logger } from "../../../utils/logger";
import {
  findUserByEmail,
  findUserById,
  toPublicUser,
  type PublicUser,
  type UserRow,
} from "../../../services/users";
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  type RefreshContext,
  type IssuedRefresh,
} from "../../../services/session";
import { getOrCreateWallet } from "../../../services/wallet";
import { createNotification } from "../../../services/notifications";
import { writeAudit } from "../../../services/audit";
import { sendMail } from "../../../services/email";
import * as templates from "../../../services/emailTemplates";
import type { SignupBody, LoginBody } from "./auth.schema";

export interface SessionResult {
  user: PublicUser;
  accessToken: string;
  refresh: IssuedRefresh;
}

function issueSession(row: UserRow, ctx: RefreshContext): SessionResult {
  const accessToken = signAccessToken(row);
  const refresh = issueRefreshToken(row.id, ctx);
  return { user: toPublicUser(row), accessToken, refresh };
}

type EmailTokenType = "verify_email" | "password_reset";

function createEmailToken(userId: string, type: EmailTokenType, ttlMinutes: number): string {
  const { token, hash } = generateToken(32);
  db.prepare(
    `INSERT INTO email_tokens (id, user_id, type, token_hash, expires_at, created_at)
     VALUES (@id, @userId, @type, @hash, @expiresAt, @createdAt)`
  ).run({
    id: uuid(),
    userId,
    type,
    hash,
    expiresAt: addMinutes(ttlMinutes).toISOString(),
    createdAt: nowIso(),
  });
  return token;
}

export async function register(input: SignupBody, ctx: RefreshContext): Promise<SessionResult> {
  if (findUserByEmail(input.email)) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const now = nowIso();
  const id = uuid();

  const row: UserRow = {
    id,
    email: input.email,
    password_hash: passwordHash,
    name: input.name,
    role: "viewer",
    status: "active",
    email_verified: 0,
    avatar_url: null,
    created_at: now,
    updated_at: now,
  };

  transaction(() => {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name, role, status, email_verified, avatar_url, created_at, updated_at)
       VALUES (@id, @email, @password_hash, @name, @role, @status, @email_verified, @avatar_url, @created_at, @updated_at)`
    ).run(row);
    getOrCreateWallet(id);
    createNotification({
      userId: id,
      type: "welcome",
      title: "Welcome to Sniser",
      body: "Verify your email to unlock purchases, payouts, and your library.",
    });
  });

  writeAudit({ actorId: id, action: "auth.register", targetType: "user", targetId: id, ip: ctx.ip });

  const session = issueSession(row, ctx);

  // Fire-and-forget email so registration latency isn't tied to SMTP.
  const verifyToken = createEmailToken(id, "verify_email", 24 * 60);
  const mail = templates.verifyEmail(row.name, verifyToken);
  void sendMail({ ...mail, to: row.email }).catch((err) =>
    logger.error({ err }, "welcome email failed")
  );

  return session;
}

export async function authenticate(
  input: LoginBody,
  ctx: RefreshContext
): Promise<SessionResult> {
  const row = findUserByEmail(input.email);
  // Always run a hash comparison to blunt user-enumeration timing attacks.
  const ok = row
    ? await verifyPassword(input.password, row.password_hash)
    : await verifyPassword(input.password, "scrypt$16384$8$1$00$00");

  if (!row || !ok) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (row.status === "suspended") {
    throw ApiError.forbidden("This account has been suspended");
  }

  writeAudit({ actorId: row.id, action: "auth.login", targetType: "user", targetId: row.id, ip: ctx.ip });
  return issueSession(row, ctx);
}

export function refresh(presentedToken: string, ctx: RefreshContext): SessionResult {
  const { userId, refresh: rotated } = rotateRefreshToken(presentedToken, ctx);
  const row = findUserById(userId);
  if (!row) throw ApiError.unauthorized("Account no longer exists");
  if (row.status === "suspended") throw ApiError.forbidden("This account has been suspended");
  return { user: toPublicUser(row), accessToken: signAccessToken(row), refresh: rotated };
}

export function logout(presentedToken: string | undefined): void {
  if (presentedToken) revokeRefreshToken(presentedToken);
}

export function verifyEmail(token: string): PublicUser {
  const hash = hashToken(token);
  const record = db
    .prepare(
      `SELECT id, user_id, expires_at, used_at FROM email_tokens
       WHERE token_hash = ? AND type = 'verify_email'`
    )
    .get(hash) as
    | { id: string; user_id: string; expires_at: string; used_at: string | null }
    | undefined;

  if (!record || record.used_at || Date.parse(record.expires_at) < Date.now()) {
    throw ApiError.badRequest("This verification link is invalid or has expired");
  }

  const now = nowIso();
  transaction(() => {
    db.prepare("UPDATE email_tokens SET used_at = ? WHERE id = ?").run(now, record.id);
    db.prepare("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?").run(
      now,
      record.user_id
    );
  });

  writeAudit({ actorId: record.user_id, action: "auth.verify_email", targetType: "user", targetId: record.user_id });
  const row = findUserById(record.user_id);
  if (!row) throw ApiError.notFound("User not found");
  return toPublicUser(row);
}

export async function resendVerification(userId: string): Promise<void> {
  const row = findUserById(userId);
  if (!row) throw ApiError.notFound("User not found");
  if (row.email_verified === 1) throw ApiError.badRequest("Email is already verified");
  const token = createEmailToken(userId, "verify_email", 24 * 60);
  const mail = templates.verifyEmail(row.name, token);
  await sendMail({ ...mail, to: row.email });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const row = findUserByEmail(email);
  // Do not reveal whether the address exists.
  if (!row) return;
  const token = createEmailToken(row.id, "password_reset", 60);
  const mail = templates.resetPassword(row.name, token);
  await sendMail({ ...mail, to: row.email });
  writeAudit({ actorId: row.id, action: "auth.request_password_reset", targetType: "user", targetId: row.id });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hash = hashToken(token);
  const record = db
    .prepare(
      `SELECT id, user_id, expires_at, used_at FROM email_tokens
       WHERE token_hash = ? AND type = 'password_reset'`
    )
    .get(hash) as
    | { id: string; user_id: string; expires_at: string; used_at: string | null }
    | undefined;

  if (!record || record.used_at || Date.parse(record.expires_at) < Date.now()) {
    throw ApiError.badRequest("This reset link is invalid or has expired");
  }

  const passwordHash = await hashPassword(newPassword);
  const now = nowIso();
  transaction(() => {
    db.prepare("UPDATE email_tokens SET used_at = ? WHERE id = ?").run(now, record.id);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
      passwordHash,
      now,
      record.user_id
    );
  });
  // Force re-login everywhere after a password reset.
  revokeAllForUser(record.user_id);
  writeAudit({ actorId: record.user_id, action: "auth.reset_password", targetType: "user", targetId: record.user_id });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const row = findUserById(userId);
  if (!row) throw ApiError.notFound("User not found");
  const ok = await verifyPassword(currentPassword, row.password_hash);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");
  const passwordHash = await hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
    passwordHash,
    nowIso(),
    userId
  );
  revokeAllForUser(userId);
  writeAudit({ actorId: userId, action: "auth.change_password", targetType: "user", targetId: userId });
}
