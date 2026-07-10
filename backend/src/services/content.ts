import { db } from "../db";
import { toUnits } from "../utils/money";

export type ContentCategory = "video" | "audio" | "original";
export type ContentStatus = "draft" | "published" | "archived";

export interface ContentRow {
  id: string;
  artist_id: string;
  title: string;
  slug: string;
  category: ContentCategory;
  description: string | null;
  price_cents: number;
  currency: string;
  cover_url: string | null;
  media_url: string | null;
  duration_sec: number;
  supply: number | null;
  status: ContentStatus;
  plays: number;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentDetailDto {
  id: string;
  slug: string;
  title: string;
  category: ContentCategory;
  description: string | null;
  price: number;
  currency: string;
  coverUrl: string | null;
  durationSec: number;
  supply: number | null;
  status: ContentStatus;
  plays: number;
  releasedAt: string | null;
  createdAt: string;
  tags: string[];
  artist: {
    id: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
    verified: boolean;
  };
}

export function findContentById(id: string): ContentRow | undefined {
  return db.prepare("SELECT * FROM content WHERE id = ?").get(id) as ContentRow | undefined;
}

export function findContentBySlug(slug: string): ContentRow | undefined {
  return db.prepare("SELECT * FROM content WHERE slug = ?").get(slug) as ContentRow | undefined;
}

/** Upsert the tag rows and replace the content's tag associations. */
export function syncTags(contentId: string, tags: string[]): void {
  const clean = Array.from(
    new Set(
      tags
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.slice(0, 40))
    )
  ).slice(0, 8);

  db.prepare("DELETE FROM content_tags WHERE content_id = ?").run(contentId);
  const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
  const findTag = db.prepare("SELECT id FROM tags WHERE name = ?");
  const link = db.prepare(
    "INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)"
  );
  for (const name of clean) {
    insertTag.run(name);
    const row = findTag.get(name) as { id: number };
    link.run(contentId, row.id);
  }
}

export function tagsForContent(contentIds: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (contentIds.length === 0) return map;
  const placeholders = contentIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT ct.content_id AS cid, t.name AS name
       FROM content_tags ct JOIN tags t ON t.id = ct.tag_id
       WHERE ct.content_id IN (${placeholders})
       ORDER BY t.name`
    )
    .all(...contentIds) as { cid: string; name: string }[];
  for (const r of rows) {
    const list = map.get(r.cid) ?? [];
    list.push(r.name);
    map.set(r.cid, list);
  }
  return map;
}

interface ArtistJoin {
  a_id: string;
  a_handle: string;
  a_name: string;
  a_avatar: string | null;
  a_verified: number;
}

export function toDetailDto(row: ContentRow, artist: ArtistJoin, tags: string[]): ContentDetailDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
    price: toUnits(row.price_cents),
    currency: row.currency,
    coverUrl: row.cover_url,
    durationSec: row.duration_sec,
    supply: row.supply,
    status: row.status,
    plays: row.plays,
    releasedAt: row.released_at,
    createdAt: row.created_at,
    tags,
    artist: {
      id: artist.a_id,
      handle: artist.a_handle,
      name: artist.a_name,
      avatarUrl: artist.a_avatar,
      verified: artist.a_verified === 1,
    },
  };
}
