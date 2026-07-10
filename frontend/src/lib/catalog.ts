/**
 * Presentational metadata for the catalog UI. The data itself now comes from
 * the backend (`endpoints.catalog.*`); this module only holds the static
 * labels, blurbs, and sort options the Browse page renders around it.
 */
import type { CatalogItem, CatalogCategory, SortKey } from "./api/types";

export type { CatalogItem, SortKey };
export type ContentCategory = CatalogCategory;

export const CATEGORY_LABEL: Record<ContentCategory, string> = {
  video: "Video",
  audio: "Audio",
  original: "Original",
  resale: "Resale",
};

export const CATEGORY_BLURB: Record<ContentCategory, string> = {
  video: "Live sets, behind-the-scenes, exclusive sessions.",
  audio: "EPs, singles, lossless drops you actually own.",
  original: "Unreleased cuts, voicenotes, lyric sheets — one-of-one.",
  resale: "Holder-listed access passes — buy from other fans.",
};

export const SORT_LABEL: Record<SortKey, string> = {
  newest: "Newest",
  popular: "Most played",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};
