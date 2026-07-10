import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendCreated } from "../../../utils/ApiResponse";
import * as contact from "./contact.service";

export const submit: RequestHandler = asyncHandler(async (req, res) => {
  const receipt = await contact.submit(req.body, { ip: req.ip, userId: req.user?.id ?? null });
  sendCreated(res, receipt);
});
