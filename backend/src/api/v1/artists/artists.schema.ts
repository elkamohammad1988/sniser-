import { z } from "zod";

/** Accept tags as a JSON array, a comma-separated string, or absent. */
const tags = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    const trimmed = val.trim();
    if (trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed.split(",");
      }
    }
    return trimmed.split(",");
  }
  return [];
}, z.array(z.string().trim().min(1).max(40)).max(8));

export const applyArtistBodySchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,30}$/, "Handle must be 3–30 chars: letters, numbers, _ or ."),
  displayName: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(80).optional(),
});

const priceField = z.coerce.number().min(0).max(100_000);

export const createContentBodySchema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.enum(["video", "audio", "original"]),
  description: z.string().trim().max(2000).optional(),
  price: priceField,
  durationSec: z.coerce.number().int().min(0).max(86_400).default(0),
  supply: z.coerce.number().int().min(1).max(1_000_000).optional(),
  tags: tags.optional(),
  releasedAt: z.string().datetime().optional(),
});

export const updateContentBodySchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  category: z.enum(["video", "audio", "original"]).optional(),
  description: z.string().trim().max(2000).optional(),
  price: priceField.optional(),
  durationSec: z.coerce.number().int().min(0).max(86_400).optional(),
  supply: z.coerce.number().int().min(1).max(1_000_000).optional(),
  tags: tags.optional(),
  releasedAt: z.string().datetime().optional(),
});

export const updateArtistBodySchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(80).optional(),
});

export const statusBodySchema = z.object({
  status: z.enum(["published", "draft", "archived"]),
});

export const myContentQuerySchema = z.object({
  status: z.enum(["all", "draft", "published", "archived"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
});

export const handleParamSchema = z.object({
  handle: z.string().trim().toLowerCase().min(3).max(30),
});

export const contentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ApplyArtistBody = z.infer<typeof applyArtistBodySchema>;
export type CreateContentBody = z.infer<typeof createContentBodySchema>;
export type UpdateContentBody = z.infer<typeof updateContentBodySchema>;
