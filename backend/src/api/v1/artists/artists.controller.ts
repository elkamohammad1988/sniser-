import { Request, RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk, sendCreated, sendNoContent, sendPaginated } from "../../../utils/ApiResponse";
import { paginationMeta } from "../../../utils/pagination";
import { assetPath } from "../../../middleware/upload";
import * as artists from "./artists.service";

type MulterFiles = Record<string, Express.Multer.File[]> | undefined;

function releaseUploads(req: Request): { coverUrl?: string; mediaUrl?: string } {
  const files = req.files as MulterFiles;
  const cover = files?.cover?.[0];
  const media = files?.media?.[0];
  return {
    coverUrl: cover ? assetPath("cover", cover.filename) : undefined,
    mediaUrl: media ? assetPath("media", media.filename) : undefined,
  };
}

export const apply: RequestHandler = asyncHandler(async (req, res) => {
  const artist = artists.becomeArtist(req.user!.id, req.body, req.ip);
  sendCreated(res, { artist });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { artist: artists.getMyArtist(req.user!.id) });
});

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  const avatar = req.file;
  const artist = artists.updateArtistProfile(req.user!.id, {
    ...req.body,
    avatarUrl: avatar ? assetPath("avatar", avatar.filename) : undefined,
  });
  sendOk(res, { artist });
});

export const dashboard: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { stats: artists.dashboardStats(req.user!.id) });
});

export const listReleases: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as unknown as artists.MyContentQuery;
  const result = artists.listMyContent(req.user!.id, query);
  sendPaginated(res, result.items, paginationMeta(result.page, result.pageSize, result.total));
});

export const createRelease: RequestHandler = asyncHandler(async (req, res) => {
  const release = artists.createContent(req.user!.id, req.body, releaseUploads(req), req.ip);
  sendCreated(res, { release });
});

export const updateRelease: RequestHandler = asyncHandler(async (req, res) => {
  const release = artists.updateContent(
    req.user!.id,
    req.params.id,
    req.body,
    releaseUploads(req),
    req.ip
  );
  sendOk(res, { release });
});

export const setStatus: RequestHandler = asyncHandler(async (req, res) => {
  const release = artists.setStatus(req.user!.id, req.params.id, req.body.status, req.ip);
  sendOk(res, { release });
});

export const deleteRelease: RequestHandler = asyncHandler(async (req, res) => {
  artists.deleteContent(req.user!.id, req.params.id, req.ip);
  sendNoContent(res);
});

export const publicProfile: RequestHandler = asyncHandler(async (req, res) => {
  sendOk(res, { artist: artists.getPublicArtist(req.params.handle) });
});
