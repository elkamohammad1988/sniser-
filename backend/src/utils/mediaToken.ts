import crypto from "node:crypto";
import { env } from "../config/env";

/**
 * Short-lived, signed tokens that authorize streaming a single content item.
 * A media `<video>`/`<audio>` element can't send an Authorization header, so
 * ownership is proven up-front (at the `/access` endpoint) and encoded into a
 * URL token the element can carry. The token is bound to (contentId, userId)
 * and expires quickly, so a leaked URL can't be shared or reused elsewhere.
 */

const PURPOSE = "media-stream:v1";
const DEFAULT_TTL_SEC = 60 * 20; // 20 minutes — long enough to watch, short enough to limit sharing.

// A dedicated key derived from the access secret: a media token is signed with
// a different key than auth JWTs, so the two can never be cross-forged.
const KEY = crypto.createHmac("sha256", env.accessSecret).update(PURPOSE).digest();

const b64url = (buf: Buffer): string => buf.toString("base64url");
const sign = (payload: string): string =>
  b64url(crypto.createHmac("sha256", KEY).update(payload).digest());

/** Mint a token authorizing `userId` to stream `contentId` for `ttlSec`. */
export function signMediaToken(contentId: string, userId: string, ttlSec = DEFAULT_TTL_SEC): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = b64url(Buffer.from(JSON.stringify({ c: contentId, u: userId, e: exp })));
  return `${payload}.${sign(payload)}`;
}

export interface MediaClaims {
  contentId: string;
  userId: string;
}

/** Verify a media token; returns its claims, or null if malformed/forged/expired. */
export function verifyMediaToken(token: string | undefined): MediaClaims | null {
  if (typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      c?: unknown;
      u?: unknown;
      e?: unknown;
    };
    if (typeof data.c !== "string" || typeof data.u !== "string" || typeof data.e !== "number") {
      return null;
    }
    if (data.e < Math.floor(Date.now() / 1000)) return null;
    return { contentId: data.c, userId: data.u };
  } catch {
    return null;
  }
}
