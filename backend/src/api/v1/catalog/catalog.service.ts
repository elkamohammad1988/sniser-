import { db } from "../../../db";
import { catalogCache } from "../../../utils/cache";
import { toUnits } from "../../../utils/money";
import { resolvePage, paginationMeta } from "../../../utils/pagination";
import { nowIso } from "../../../utils/datetime";
import { ApiError } from "../../../utils/ApiError";
import {
  findContentBySlug,
  tagsForContent,
  toDetailDto,
  type ContentDetailDto,
} from "../../../services/content";
import type { ListQuery, SortKey, CategoryFilter } from "./catalog.schema";

export interface CatalogItemDto {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artistHandle: string;
  category: "video" | "audio" | "original" | "resale";
  kind: "primary" | "resale";
  listingId: string | null;
  price: number;
  currency: string;
  releasedAt: string;
  plays: number;
  durationSec: number;
  coverUrl: string | null;
  tags: string[];
}

interface RawRow {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artist_handle: string;
  category: string;
  kind: "primary" | "resale";
  listing_id: string | null;
  price_cents: number;
  currency: string;
  released_at: string;
  plays: number;
  duration_sec: number;
  cover_url: string | null;
}

const ORDER_BY: Record<SortKey, string> = {
  newest: "released_at DESC",
  popular: "plays DESC",
  "price-asc": "price_cents ASC",
  "price-desc": "price_cents DESC",
};

const CONTENT_SELECT = /* sql */ `
  SELECT c.id AS id, c.slug AS slug, c.title AS title,
         ap.display_name AS artist, ap.handle AS artist_handle,
         c.category AS category, 'primary' AS kind, NULL AS listing_id,
         c.price_cents AS price_cents, c.currency AS currency,
         COALESCE(c.released_at, c.created_at) AS released_at,
         c.plays AS plays, c.duration_sec AS duration_sec, c.cover_url AS cover_url
  FROM content c
  JOIN artist_profiles ap ON ap.id = c.artist_id
  WHERE c.status = 'published' AND (c.released_at IS NULL OR c.released_at <= @now)
`;

const RESALE_SELECT = /* sql */ `
  SELECT rl.id AS id, c.slug AS slug, (c.title || ' — Resale pass') AS title,
         ('Listed by ' || seller.name) AS artist, ap.handle AS artist_handle,
         'resale' AS category, 'resale' AS kind, rl.id AS listing_id,
         rl.price_cents AS price_cents, c.currency AS currency,
         rl.created_at AS released_at,
         0 AS plays, c.duration_sec AS duration_sec, c.cover_url AS cover_url
  FROM resale_listings rl
  JOIN content c ON c.id = rl.content_id
  JOIN artist_profiles ap ON ap.id = c.artist_id
  JOIN users seller ON seller.id = rl.seller_id
  WHERE rl.status = 'active'
`;

interface SidePart {
  sql: string;
  params: Record<string, unknown>;
}

function contentPart(category: CategoryFilter, q: string | undefined): SidePart {
  const params: Record<string, unknown> = { now: nowIso() };
  let sql = CONTENT_SELECT;
  if (category !== "all") {
    sql += " AND c.category = @cat";
    params.cat = category;
  }
  if (q) {
    sql += ` AND (c.title LIKE @q OR ap.display_name LIKE @q
      OR EXISTS (SELECT 1 FROM content_tags ct JOIN tags t ON t.id = ct.tag_id
                 WHERE ct.content_id = c.id AND t.name LIKE @q))`;
    params.q = `%${q}%`;
  }
  return { sql, params };
}

function resalePart(q: string | undefined): SidePart {
  const params: Record<string, unknown> = {};
  let sql = RESALE_SELECT;
  if (q) {
    sql += " AND (c.title LIKE @q OR seller.name LIKE @q)";
    params.q = `%${q}%`;
  }
  return { sql, params };
}

/** Build the UNION-ed base query + merged params for the requested category. */
function buildBase(category: CategoryFilter, q: string | undefined): SidePart {
  const includeContent = category !== "resale";
  const includeResale = category === "all" || category === "resale";

  const parts: string[] = [];
  let params: Record<string, unknown> = {};

  if (includeContent) {
    const c = contentPart(category, q);
    parts.push(c.sql);
    params = { ...params, ...c.params };
  }
  if (includeResale) {
    const r = resalePart(q);
    parts.push(r.sql);
    params = { ...params, ...r.params };
  }
  return { sql: parts.join("\nUNION ALL\n"), params };
}

function toDto(row: RawRow): CatalogItemDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    artist: row.artist,
    artistHandle: row.artist_handle,
    category: row.category as CatalogItemDto["category"],
    kind: row.kind,
    listingId: row.listing_id,
    price: toUnits(row.price_cents),
    currency: row.currency,
    releasedAt: row.released_at,
    plays: row.plays,
    durationSec: row.duration_sec,
    coverUrl: row.cover_url,
    tags: [],
  };
}

export interface CatalogPage {
  items: CatalogItemDto[];
  pagination: ReturnType<typeof paginationMeta>;
}

export function listCatalog(query: ListQuery): CatalogPage {
  const cacheKey = `list:${query.category}:${query.sort}:${query.q ?? ""}:${query.page}:${query.pageSize}`;
  const cached = catalogCache.get(cacheKey) as CatalogPage | undefined;
  if (cached) return cached;

  const { page, pageSize, offset } = resolvePage(query.page, query.pageSize);
  const base = buildBase(query.category, query.q);

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM (${base.sql})`).get(base.params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT * FROM (${base.sql})
       ORDER BY ${ORDER_BY[query.sort]}, id ASC
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...base.params, limit: pageSize, offset }) as RawRow[];

  const items = rows.map(toDto);

  // Attach tags: real tags for primary content, a synthetic label for resale.
  const contentIds = items.filter((i) => i.kind === "primary").map((i) => i.id);
  const tagMap = tagsForContent(contentIds);
  for (const item of items) {
    item.tags = item.kind === "resale" ? ["Resale"] : tagMap.get(item.id) ?? [];
  }

  const result: CatalogPage = { items, pagination: paginationMeta(page, pageSize, total) };
  catalogCache.set(cacheKey, result);
  return result;
}

export interface CategorySummary {
  key: "video" | "audio" | "original" | "resale";
  count: number;
}

export function categorySummary(): CategorySummary[] {
  return catalogCache.wrap("categories", () => {
    const contentRows = db
      .prepare(
        `SELECT category, COUNT(*) AS n FROM content
         WHERE status = 'published' AND (released_at IS NULL OR released_at <= ?)
         GROUP BY category`
      )
      .all(nowIso()) as { category: string; n: number }[];
    const resale = (
      db.prepare("SELECT COUNT(*) AS n FROM resale_listings WHERE status = 'active'").get() as {
        n: number;
      }
    ).n;

    const counts: Record<string, number> = { video: 0, audio: 0, original: 0, resale };
    for (const r of contentRows) counts[r.category] = r.n;
    return (["video", "audio", "original", "resale"] as const).map((key) => ({
      key,
      count: counts[key],
    }));
  });
}

export function trending(limit = 6): CatalogItemDto[] {
  const rows = db
    .prepare(`${CONTENT_SELECT} ORDER BY c.plays DESC LIMIT @limit`)
    .all({ now: nowIso(), limit }) as RawRow[];
  const items = rows.map(toDto);
  const tagMap = tagsForContent(items.map((i) => i.id));
  for (const item of items) item.tags = tagMap.get(item.id) ?? [];
  return items;
}

export function getBySlug(slug: string, viewerId?: string): ContentDetailDto & { owned: boolean } {
  const row = findContentBySlug(slug);
  if (!row || row.status !== "published") throw ApiError.notFound("Content not found");

  const artist = db
    .prepare(
      `SELECT ap.id AS a_id, ap.handle AS a_handle, ap.display_name AS a_name,
              ap.avatar_url AS a_avatar, ap.verified AS a_verified
       FROM artist_profiles ap WHERE ap.id = ?`
    )
    .get(row.artist_id) as {
    a_id: string;
    a_handle: string;
    a_name: string;
    a_avatar: string | null;
    a_verified: number;
  };

  const tags = tagsForContent([row.id]).get(row.id) ?? [];
  const detail = toDetailDto(row, artist, tags);

  let owned = false;
  if (viewerId) {
    const has = db
      .prepare(
        "SELECT 1 FROM purchases WHERE user_id = ? AND content_id = ? AND status IN ('active','listed')"
      )
      .get(viewerId, row.id);
    owned = Boolean(has);
  }
  return { ...detail, owned };
}
