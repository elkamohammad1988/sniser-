import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk } from "../../../utils/ApiResponse";
import { assetPath } from "../../../middleware/upload";
import * as users from "./users.service";

export const account: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, users.getAccount(req.user!.id));
});

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  const avatar = req.file;
  const user = users.updateProfile(
    req.user!.id,
    { name: req.body.name, avatarUrl: avatar ? assetPath("avatar", avatar.filename) : undefined },
    req.ip
  );
  sendOk(res, { user });
});
