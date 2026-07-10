import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk, sendCreated } from "../../../utils/ApiResponse";
import * as purchases from "./purchases.service";

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const result = purchases.purchaseContent(req.user!.id, req.body.contentId, req.ip);
  sendCreated(res, result);
});

export const library: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { items: purchases.listLibrary(req.user!.id) });
});

export const access: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { access: purchases.getAccess(req.user!.id, req.params.contentId) });
});
