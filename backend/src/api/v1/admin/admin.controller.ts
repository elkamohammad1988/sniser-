import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk, sendPaginated } from "../../../utils/ApiResponse";
import * as admin from "./admin.service";

export const stats: RequestHandler = asyncHandler(async (_req, res) => {
  sendOk(res, { stats: admin.platformStats() });
});

export const users: RequestHandler = asyncHandler(async (req, res) => {
  const result = admin.listUsers(req.query as never);
  sendPaginated(res, result.items, result.pagination);
});

export const updateUser: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { user: admin.updateUser(req.user!.id, req.params.id, req.body, req.ip) });
});

export const tickets: RequestHandler = asyncHandler(async (req, res) => {
  const result = admin.listTickets(req.query as never);
  sendPaginated(res, result.items, result.pagination);
});

export const updateTicket: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { ticket: admin.updateTicket(req.user!.id, req.params.id, req.body.status, req.ip) });
});

export const audit: RequestHandler = asyncHandler(async (req, res) => {
  const result = admin.listAudit(req.query as never);
  sendPaginated(res, result.items, result.pagination);
});
