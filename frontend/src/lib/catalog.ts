/**
 * Presentational metadata for the catalog UI. The data itself now comes from
 * the backend (`endpoints.catalog.*`); this module only holds the static
 * labels, blurbs, and sort options the Browse page renders around it.
 */
import type { CatalogItem, CatalogCategory, SortKey } from "./api/types";

export type { CatalogItem, SortKey };
export type ContentCategory = CatalogCategory;

// Values are i18n key strings — resolve them with `t(...)` at the render site.
export const CATEGORY_LABEL: Record<ContentCategory, string> = {
  video: "catalog.category.video",
  audio: "catalog.category.audio",
  original: "catalog.category.original",
  resale: "catalog.category.resale",
};

export const CATEGORY_BLURB: Record<ContentCategory, string> = {
  video: "catalog.blurb.video",
  audio: "catalog.blurb.audio",
  original: "catalog.blurb.original",
  resale: "catalog.blurb.resale",
};

export const SORT_LABEL: Record<SortKey, string> = {
  newest: "catalog.sort.newest",
  popular: "catalog.sort.popular",
  "price-asc": "catalog.sort.priceAsc",
  "price-desc": "catalog.sort.priceDesc",
};
