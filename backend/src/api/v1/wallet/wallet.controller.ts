import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk } from "../../../utils/ApiResponse";
import * as wallet from "./wallet.service";

export const summary: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { wallet: wallet.getSummary(req.user!.id) });
});

export const deposit: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { wallet: wallet.deposit(req.user!.id, req.body.amount, req.ip) });
});

export const transactions: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { transactions: wallet.transactions(req.user!.id) });
});
