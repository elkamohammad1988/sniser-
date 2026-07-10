import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk, sendCreated, sendNoContent } from "../../../utils/ApiResponse";
import * as resale from "./resale.service";

export const create: RequestHandler = asyncHandler(async (req, res) => {
  const listing = resale.createListing(req.user!.id, req.body.purchaseId, req.body.price, req.ip);
  sendCreated(res, { listing });
});

export const mine: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { listings: resale.listMine(req.user!.id) });
});

export const cancel: RequestHandler = asyncHandler(async (req, res) => {
  resale.cancelListing(req.user!.id, req.params.id, req.ip);
  sendNoContent(res);
});

export const buy: RequestHandler = asyncHandler(async (req, res) => {
  const result = resale.buyListing(req.user!.id, req.params.id, req.ip);
  sendCreated(res, result);
});
