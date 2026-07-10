import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk } from "../../../utils/ApiResponse";
import {
  listNotifications,
  unreadCount,
  markRead,
} from "../../../services/notifications";

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  sendOk(res, {
    notifications: listNotifications(userId),
    unread: unreadCount(userId),
  });
});

export const markAsRead: RequestHandler = asyncHandler(async (req, res) => {
  const updated = markRead(req.user!.id, req.body.ids);
  sendOk(res, { updated, unread: unreadCount(req.user!.id) });
});
