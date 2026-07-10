import { RequestHandler } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import { sendOk, sendPaginated } from "../../../utils/ApiResponse";
import * as catalog from "./catalog.service";
import type { ListQuery } from "./catalog.schema";

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const page = catalog.listCatalog(req.query as unknown as ListQuery);
  sendPaginated(res, page.items, page.pagination);
});

export const categories: RequestHandler = asyncHandler(async (_req, res) => {
  sendOk(res, { categories: catalog.categorySummary() });
});

export const trending: RequestHandler = asyncHandler(async (_req, res) => {
  sendOk(res, { items: catalog.trending() });
});

export const detail: RequestHandler = asyncHandler(async (req, res) => {
  const item = catalog.getBySlug(req.params.slug, req.user?.id);
  sendOk(res, { item });
});
