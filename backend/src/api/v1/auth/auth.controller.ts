import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk, sendCreated } from "../../../utils/ApiResponse";
import { ApiError } from "../../../utils/ApiError";
import { REFRESH_COOKIE, setRefreshCookie, clearRefreshCookie } from "../../../utils/cookies";
import { findUserById, toPublicUser } from "../../../services/users";
import * as authService from "./auth.service";
import type { SessionResult } from "./auth.service";

function refreshContext(req: Parameters<RequestHandler>[0]) {
  return { ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

/** Shape returned to the client — the refresh token lives only in the cookie. */
function sessionPayload(result: SessionResult) {
  return { token: result.accessToken, user: result.user };
}

export const signup: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, refreshContext(req));
  setRefreshCookie(res, result.refresh.token, result.refresh.expiresAt);
  sendCreated(res, sessionPayload(result));
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.authenticate(req.body, refreshContext(req));
  setRefreshCookie(res, result.refresh.token, result.refresh.expiresAt);
  sendOk(res, sessionPayload(result));
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("No active session");
  const result = authService.refresh(token, refreshContext(req));
  setRefreshCookie(res, result.refresh.token, result.refresh.expiresAt);
  sendOk(res, sessionPayload(result));
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  authService.logout(token);
  clearRefreshCookie(res);
  sendOk(res, { ok: true });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const row = findUserById(req.user!.id);
  if (!row) throw ApiError.unauthorized("Account no longer exists");
  sendOk(res, { user: toPublicUser(row) });
});

export const verifyEmail: RequestHandler = asyncHandler(async (req, res) => {
  const user = authService.verifyEmail(req.body.token);
  sendOk(res, { user });
});

export const resendVerification: RequestHandler = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user!.id);
  sendOk(res, { ok: true });
});

export const forgotPassword: RequestHandler = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  // Always 200 to avoid leaking which emails are registered.
  sendOk(res, { ok: true });
});

export const resetPassword: RequestHandler = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  sendOk(res, { ok: true });
});

export const changePassword: RequestHandler = asyncHandler(async (req, res) => {
  await authService.changePassword(
    req.user!.id,
    req.body.currentPassword,
    req.body.newPassword
  );
  sendOk(res, { ok: true });
});
