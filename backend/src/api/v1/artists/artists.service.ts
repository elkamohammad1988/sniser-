import { db, transaction } from "../../../db";
import { uuid, slugify } from "../../../utils/ids";
import { nowIso } from "../../../utils/datetime";
import { toCents, toUnits } from "../../../utils/money";
import { ApiError } from "../../../utils/ApiError";
import { catalogCache } from "../../../utils/cache";
import { writeAudit } from "../../../services/audit";
import { createNotification } from "../../../services/notifications";
import { getWalletByUser } from "../../../services/wallet";
import {
  findContentById,
  syncTags,
  tagsForContent,
  toDetailDto,
  type ContentRow,
  type ContentDetailDto,
} from "../../../services/content";
import { findUserById } from "../../../services/users";
import type { ApplyArtistBody, CreateContentBody, UpdateContentBody } from "./artists.schema";

export interface ArtistProfileRow {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  verified: number;
  created_at: string;
  updated_at: string;
}

export interface ArtistDto {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  verified: boolean;
  createdAt: string;
}

interface UploadPaths {
  coverUrl?: string;
  mediaUrl?: string;
}

function toArtistDto(row: ArtistProfileRow): ArtistDto {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    location: row.location,
    verified: row.verified === 1,
    createdAt: row.created_at,
  };
}

export function getArtistByUser(userId: string): ArtistProfileRow | undefined {
  return db.prepare("SELECT * FROM artist_profiles WHERE user_id = ?").get(userId) as
    | ArtistProfileRow
    | undefined;
}

function requireArtist(userId: string): ArtistProfileRow {
  const artist = getArtistByUser(userId);
  if (!artist) throw ApiError.forbidden("You need an artist profile to do that");
  return artist;
}

export function becomeArtist(userId: string, input: ApplyArtistBody, ip?: string | null): ArtistDto {
  const user = findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (getArtistByUser(userId)) throw ApiError.conflict("You already have an artist profile");

  const handleTaken = db
    .prepare("SELECT 1 FROM artist_profiles WHERE handle = ?")
    .get(input.handle);
  if (handleTaken) throw ApiError.conflict("That handle is already taken");

  const now = nowIso();
  const row: ArtistProfileRow = {
    id: uuid(),
    user_id: userId,
    handle: input.handle,
    display_name: input.displayName,
    bio: input.bio ?? null,
    avatar_url: user.avatar_url,
    location: input.location ?? null,
    verified: 0,
    created_at: now,
    updated_at: now,
  };

  transaction(() => {
    db.prepare(
      `INSERT INTO artist_profiles (id, user_id, handle, display_name, bio, avatar_url, location, verified, created_at, updated_at)
       VALUES (@id, @user_id, @handle, @display_name, @bio, @avatar_url, @location, @verified, @created_at, @updated_at)`
    ).run(row);
    if (user.role === "viewer") {
      db.prepare("UPDATE users SET role = 'artist', updated_at = ? WHERE id = ?").run(now, userId);
    }
    createNotification({
      userId,
      type: "artist_welcome",
      title: "You're now a Sniser artist",
      body: "Create your first release and start earning from your work.",
    });
  });

  writeAudit({ actorId: userId, action: "artist.create_profile", targetType: "artist", targetId: row.id, ip });
  return toArtistDto(row);
}

export interface UpdateArtistPatch {
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}

export function updateArtistProfile(userId: string, patch: UpdateArtistPatch): ArtistDto {
  const artist = requireArtist(userId);
  const next = {
    display_name: patch.displayName ?? artist.display_name,
    bio: patch.bio ?? artist.bio,
    location: patch.location ?? artist.location,
    avatar_url: patch.avatarUrl ?? artist.avatar_url,
  };
  db.prepare(
    `UPDATE artist_profiles SET display_name = @display_name, bio = @bio, location = @location,
       avatar_url = @avatar_url, updated_at = @updated_at WHERE id = @id`
  ).run({ ...next, updated_at: nowIso(), id: artist.id });
  return toArtistDto({ ...artist, ...next });
}

export function getMyArtist(userId: string): ArtistDto {
  return toArtistDto(requireArtist(userId));
}

function uniqueSlug(title: string): string {
  const base = slugify(title) || "release";
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const exists = db.prepare("SELECT 1 FROM content WHERE slug = ?").get(slug);
    if (!exists) return slug;
    slug = `${base}-${uuid().slice(0, 5)}`;
  }
  return `${base}-${uuid().slice(0, 8)}`;
}

function detailFor(row: ContentRow): ContentDetailDto {
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
  return toDetailDto(row, artist, tags);
}

export function createContent(
  userId: string,
  input: CreateContentBody,
  files: UploadPaths,
  ip?: string | null
): ContentDetailDto {
  const artist = requireArtist(userId);
  const now = nowIso();
  const id = uuid();
  const row: ContentRow = {
    id,
    artist_id: artist.id,
    title: input.title,
    slug: uniqueSlug(input.title),
    category: input.category,
    description: input.description ?? null,
    price_cents: toCents(input.price),
    currency: "USDC",
    cover_url: files.coverUrl ?? null,
    media_url: files.mediaUrl ?? null,
    duration_sec: input.durationSec ?? 0,
    supply: input.supply ?? null,
    status: "draft",
    plays: 0,
    released_at: input.releasedAt ?? null,
    created_at: now,
    updated_at: now,
  };

  transaction(() => {
    db.prepare(
      `INSERT INTO content (id, artist_id, title, slug, category, description, price_cents, currency,
         cover_url, media_url, duration_sec, supply, status, plays, released_at, created_at, updated_at)
       VALUES (@id, @artist_id, @title, @slug, @category, @description, @price_cents, @currency,
         @cover_url, @media_url, @duration_sec, @supply, @status, @plays, @released_at, @created_at, @updated_at)`
    ).run(row);
    syncTags(id, input.tags ?? []);
  });

  catalogCache.invalidate();
  writeAudit({ actorId: userId, action: "content.create", targetType: "content", targetId: id, ip });
  return detailFor(row);
}

function ownContentOrThrow(userId: string, contentId: string): { artist: ArtistProfileRow; content: ContentRow } {
  const artist = requireArtist(userId);
  const content = findContentById(contentId);
  if (!content || content.artist_id !== artist.id) {
    throw ApiError.notFound("Release not found");
  }
  return { artist, content };
}

export function updateContent(
  userId: string,
  contentId: string,
  input: UpdateContentBody,
  files: UploadPaths,
  ip?: string | null
): ContentDetailDto {
  const { content } = ownContentOrThrow(userId, contentId);

  const next: ContentRow = {
    ...content,
    title: input.title ?? content.title,
    category: input.category ?? content.category,
    description: input.description ?? content.description,
    price_cents: input.price !== undefined ? toCents(input.price) : content.price_cents,
    duration_sec: input.durationSec ?? content.duration_sec,
    supply: input.supply ?? content.supply,
    released_at: input.releasedAt ?? content.released_at,
    cover_url: files.coverUrl ?? content.cover_url,
    media_url: files.mediaUrl ?? content.media_url,
    updated_at: nowIso(),
  };

  transaction(() => {
    db.prepare(
      `UPDATE content SET title = @title, category = @category, description = @description,
         price_cents = @price_cents, duration_sec = @duration_sec, supply = @supply,
         released_at = @released_at, cover_url = @cover_url, media_url = @media_url,
         updated_at = @updated_at WHERE id = @id`
    ).run(next);
    if (input.tags !== undefined) syncTags(contentId, input.tags);
  });

  catalogCache.invalidate();
  writeAudit({ actorId: userId, action: "content.update", targetType: "content", targetId: contentId, ip });
  return detailFor(next);
}

export function setStatus(
  userId: string,
  contentId: string,
  status: "published" | "draft" | "archived",
  ip?: string | null
): ContentDetailDto {
  const { content } = ownContentOrThrow(userId, contentId);
  const now = nowIso();
  const releasedAt =
    status === "published" && !content.released_at ? now : content.released_at;

  db.prepare("UPDATE content SET status = ?, released_at = ?, updated_at = ? WHERE id = ?").run(
    status,
    releasedAt,
    now,
    contentId
  );
  catalogCache.invalidate();
  writeAudit({ actorId: userId, action: `content.${status}`, targetType: "content", targetId: contentId, ip });
  return detailFor({ ...content, status, released_at: releasedAt, updated_at: now });
}

export function deleteContent(userId: string, contentId: string, ip?: string | null): void {
  ownContentOrThrow(userId, contentId); // asserts ownership, throws otherwise
  const sales = db
    .prepare("SELECT COUNT(*) AS n FROM purchases WHERE content_id = ?")
    .get(contentId) as { n: number };
  if (sales.n > 0) {
    throw ApiError.conflict("This release has sales and can't be deleted — archive it instead");
  }
  db.prepare("DELETE FROM content WHERE id = ?").run(contentId);
  catalogCache.invalidate();
  writeAudit({ actorId: userId, action: "content.delete", targetType: "content", targetId: contentId, ip });
}

export interface MyContentQuery {
  status: "all" | "draft" | "published" | "archived";
  page: number;
  pageSize: number;
}

export function listMyContent(userId: string, query: MyContentQuery) {
  const artist = requireArtist(userId);
  const offset = (query.page - 1) * query.pageSize;
  const where = query.status === "all" ? "artist_id = ?" : "artist_id = ? AND status = ?";
  const params = query.status === "all" ? [artist.id] : [artist.id, query.status];

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM content WHERE ${where}`).get(...params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT * FROM content WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, query.pageSize, offset) as ContentRow[];

  const tagMap = tagsForContent(rows.map((r) => r.id));
  const salesByContent = db
    .prepare(
      `SELECT content_id, COUNT(*) AS sales FROM purchases GROUP BY content_id`
    )
    .all() as { content_id: string; sales: number }[];
  const salesMap = new Map(salesByContent.map((s) => [s.content_id, s.sales]));

  const items = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    price: toUnits(row.price_cents),
    currency: row.currency,
    coverUrl: row.cover_url,
    durationSec: row.duration_sec,
    supply: row.supply,
    plays: row.plays,
    releasedAt: row.released_at,
    createdAt: row.created_at,
    tags: tagMap.get(row.id) ?? [],
    sales: salesMap.get(row.id) ?? 0,
  }));

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export interface PublicArtist extends ArtistDto {
  releases: ReturnType<typeof publicRelease>[];
  stats: { releases: number; totalPlays: number };
}

function publicRelease(row: ContentRow, tags: string[]) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    price: toUnits(row.price_cents),
    currency: row.currency,
    coverUrl: row.cover_url,
    durationSec: row.duration_sec,
    plays: row.plays,
    releasedAt: row.released_at,
    tags,
  };
}

export function getPublicArtist(handle: string): PublicArtist {
  const row = db.prepare("SELECT * FROM artist_profiles WHERE handle = ?").get(handle) as
    | ArtistProfileRow
    | undefined;
  if (!row) throw ApiError.notFound("Artist not found");

  const releases = db
    .prepare(
      `SELECT * FROM content WHERE artist_id = ? AND status = 'published'
         AND (released_at IS NULL OR released_at <= ?)
       ORDER BY COALESCE(released_at, created_at) DESC`
    )
    .all(row.id, nowIso()) as ContentRow[];

  const tagMap = tagsForContent(releases.map((r) => r.id));
  const totalPlays = releases.reduce((sum, r) => sum + r.plays, 0);

  return {
    ...toArtistDto(row),
    releases: releases.map((r) => publicRelease(r, tagMap.get(r.id) ?? [])),
    stats: { releases: releases.length, totalPlays },
  };
}

export function dashboardStats(userId: string) {
  const artist = requireArtist(userId);

  const contentAgg = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
              COALESCE(SUM(plays), 0) AS plays
       FROM content WHERE artist_id = ?`
    )
    .get(artist.id) as { total: number; published: number | null; plays: number };

  const salesAgg = db
    .prepare(
      `SELECT COUNT(*) AS sales, COALESCE(SUM(p.price_cents - p.fee_cents), 0) AS net_cents
       FROM purchases p JOIN content c ON c.id = p.content_id
       WHERE c.artist_id = ? AND p.acquired_via = 'primary'`
    )
    .get(artist.id) as { sales: number; net_cents: number };

  const wallet = getWalletByUser(userId);

  return {
    releases: contentAgg.total,
    published: contentAgg.published ?? 0,
    totalPlays: contentAgg.plays,
    sales: salesAgg.sales,
    revenue: toUnits(salesAgg.net_cents),
    walletBalance: wallet ? toUnits(wallet.balance_cents) : 0,
    currency: "USDC",
  };
}
