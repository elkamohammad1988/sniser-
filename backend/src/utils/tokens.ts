import crypto from "node:crypto";

/**
 * Opaque secret tokens (refresh tokens, email verification / reset links).
 * The plaintext is returned to the client exactly once; only its SHA-256 hash
 * is persisted, so a database leak never exposes usable tokens.
 */

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32): { token: string; hash: string } {
  const token = randomToken(bytes);
  return { token, hash: hashToken(token) };
}
