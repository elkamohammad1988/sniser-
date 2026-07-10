import { z } from "zod";

export const CATEGORY_VALUES = ["all", "video", "audio", "original", "resale"] as const;
export const SORT_VALUES = ["newest", "popular", "price-asc", "price-desc"] as const;

export const listQuerySchema = z.object({
  category: z.enum(CATEGORY_VALUES).default("all"),
  sort: z.enum(SORT_VALUES).default("newest"),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CategoryFilter = (typeof CATEGORY_VALUES)[number];
export type SortKey = (typeof SORT_VALUES)[number];
