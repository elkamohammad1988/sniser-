import type { Response } from "express";
import { env } from "../config/env";

/**
 * The refresh token is delivered as an httpOnly cookie so it is never readable
 * from JavaScript (XSS-resistant). It is scoped to the auth path so it is only
 * ever sent to the refresh/logout endpoints.
 */
export const REFRESH_COOKIE = "sniser_rt";

const cookiePath = `${env.API_PREFIX}/v1/auth`;

export function setRefreshCookie(res: Response, token: string, expires: Date): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.isProd ? "none" : "lax",
    domain: env.COOKIE_DOMAIN,
    path: cookiePath,
    expires,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.isProd ? "none" : "lax",
    domain: env.COOKIE_DOMAIN,
    path: cookiePath,
  });
}
