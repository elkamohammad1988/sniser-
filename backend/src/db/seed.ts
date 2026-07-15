import fs from "node:fs";
import path from "node:path";
import { getDb, transaction } from "./index";
import { env } from "../config/env";
import { uuid, slugify, walletAddress } from "../utils/ids";
import { hashPassword } from "../utils/password";
import { toCents } from "../utils/money";
import { nowIso } from "../utils/datetime";
import { logger } from "../utils/logger";

/**
 * Reference seed data. Idempotent: only runs when the users table is empty.
 * It reproduces the original static catalog as real, queryable rows and creates
 * demo accounts so every flow (login, purchase, resale, artist studio, admin)
 * is exercisable immediately after a fresh boot.
 */

interface SeedArtist {
  handle: string;
  displayName: string;
  bio: string;
  location: string;
}

interface SeedContent {
  key: string;
  title: string;
  artist: string; // handle
  category: "video" | "audio" | "original";
  price: number;
  releasedAt: string;
  plays: number;
  durationSec: number;
  tags: string[];
  supply?: number;
}

const ARTISTS: SeedArtist[] = [
  { handle: "novareign", displayName: "Nova Reign", bio: "Synth-pop auteur crafting neon-lit anthems.", location: "London, UK" },
  { handle: "atlascole", displayName: "Atlas Cole", bio: "Producer and multi-instrumentalist. Cobalt everything.", location: "Berlin, DE" },
  { handle: "linakhoury", displayName: "Lina Khoury", bio: "Songs written on the road, recorded on location.", location: "Marrakech, MA" },
  { handle: "kaimori", displayName: "Kai Mori", bio: "After-hours electronic sets and exclusive voicenotes.", location: "Tokyo, JP" },
  { handle: "junobell", displayName: "Juno Bell", bio: "Acoustic first-takes and unreleased demos.", location: "Austin, US" },
  { handle: "marcusvale", displayName: "Marcus Vale", bio: "Folk-leaning singer-songwriter.", location: "Dublin, IE" },
];

const CONTENT: SeedContent[] = [
  { key: "v-001", title: "Neon Skyline (Live)", artist: "novareign", category: "video", price: 12, releasedAt: "2026-05-10", plays: 184_320, durationSec: 263, tags: ["Live", "HD"] },
  { key: "v-002", title: "Studio Diaries: Vol. III", artist: "atlascole", category: "video", price: 8, releasedAt: "2026-04-22", plays: 92_410, durationSec: 612, tags: ["Behind the scenes"] },
  { key: "v-003", title: "Sunset Sessions — Marrakech", artist: "linakhoury", category: "video", price: 15, releasedAt: "2026-03-30", plays: 41_220, durationSec: 425, tags: ["Live", "On location"] },
  { key: "v-004", title: "After Hours: Tokyo", artist: "kaimori", category: "video", price: 18, releasedAt: "2026-02-14", plays: 311_900, durationSec: 538, tags: ["Live", "Encore"] },
  { key: "v-005", title: "First Take", artist: "junobell", category: "video", price: 6, releasedAt: "2026-01-09", plays: 12_400, durationSec: 197, tags: ["Acoustic"] },

  { key: "a-001", title: "Velvet Static EP", artist: "novareign", category: "audio", price: 9, releasedAt: "2026-04-30", plays: 540_120, durationSec: 1_280, tags: ["EP", "Lossless"] },
  { key: "a-002", title: "Cobalt", artist: "atlascole", category: "audio", price: 5, releasedAt: "2026-04-02", plays: 287_660, durationSec: 218, tags: ["Single"] },
  { key: "a-003", title: "Letters Home", artist: "linakhoury", category: "audio", price: 7, releasedAt: "2026-03-12", plays: 96_300, durationSec: 245, tags: ["Single"] },
  { key: "a-004", title: "Long Way Around", artist: "marcusvale", category: "audio", price: 4, releasedAt: "2026-02-19", plays: 32_780, durationSec: 209, tags: ["Single", "Acoustic"] },

  { key: "o-001", title: "Untitled Demo #07", artist: "junobell", category: "original", price: 25, releasedAt: "2026-05-05", plays: 6_120, durationSec: 188, tags: ["Demo", "Unreleased"], supply: 1 },
  { key: "o-002", title: "Voicenote 02 — 3 AM", artist: "kaimori", category: "original", price: 19, releasedAt: "2026-04-18", plays: 9_240, durationSec: 92, tags: ["Voicenote", "Exclusive"], supply: 1 },
  { key: "o-003", title: "Lyric Sheet — Goldline", artist: "novareign", category: "original", price: 32, releasedAt: "2026-03-01", plays: 4_500, durationSec: 0, tags: ["Lyrics", "Signed"], supply: 1 },
];

// Resale listings: collector owns these content items and lists them.
const RESALE: { content: string; price: number }[] = [
  { content: "a-001", price: 14 },
  { content: "v-001", price: 22 },
  { content: "a-002", price: 7 },
  { content: "a-003", price: 10 },
];

interface SampleMedia {
  video: string | null;
  audio: string | null;
}

/**
 * Copy the version-controlled sample media into the served uploads dir so the
 * seeded catalog is immediately playable (video + audio) out of the box. The
 * source files live under `backend/assets/samples` (tracked in git); the served
 * `data/uploads` tree is runtime-only (gitignored), so they're provisioned here
 * on first seed. Best-effort — a missing source just leaves that kind of drop
 * without a preview file (the player degrades gracefully to a "coming soon"
 * state), it never fails the seed.
 */
function provisionSampleMedia(): SampleMedia {
  const srcDir = path.join(__dirname, "..", "..", "assets", "samples");
  const destDir = path.join(env.uploadDir, "media");
  fs.mkdirSync(destDir, { recursive: true });

  const provision = (file: string): string | null => {
    const src = path.join(srcDir, file);
    if (!fs.existsSync(src)) {
      logger.warn({ file }, "sample media not found; seeded drops will have no preview");
      return null;
    }
    try {
      fs.copyFileSync(src, path.join(destDir, file));
      return `/uploads/media/${file}`;
    } catch (err) {
      logger.warn({ err, file }, "failed to provision sample media");
      return null;
    }
  };

  return {
    video: provision("preview-video.mp4"),
    audio: provision("preview-audio.mp3"),
  };
}

/**
 * Pick the preview file for a seeded drop. Video drops preview as video; audio
 * drops as audio; an "original" drop previews as audio when it has a runtime
 * (voicenotes/demos) and has none when it's a zero-length artifact (e.g. a
 * signed lyric sheet), which the player surfaces as a download-only item.
 */
function mediaUrlFor(item: SeedContent, media: SampleMedia): string | null {
  if (item.category === "video") return media.video;
  if (item.category === "audio") return media.audio;
  return item.durationSec > 0 ? media.audio : null;
}

async function createUser(opts: {
  email: string;
  name: string;
  password: string;
  role: "viewer" | "artist" | "admin";
  verified?: boolean;
  balanceCents?: number;
}): Promise<string> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();
  const hash = await hashPassword(opts.password);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, role, status, email_verified, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, NULL, ?, ?)`
  ).run(id, opts.email.toLowerCase(), hash, opts.name, opts.role, opts.verified ? 1 : 0, now, now);

  const balance = opts.balanceCents ?? 0;
  const walletId = uuid();
  db.prepare(
    `INSERT INTO wallets (id, user_id, balance_cents, currency, address, created_at, updated_at)
     VALUES (?, ?, ?, 'USDC', ?, ?, ?)`
  ).run(walletId, id, balance, walletAddress(), now, now);
  if (balance > 0) {
    db.prepare(
      `INSERT INTO wallet_transactions (id, wallet_id, type, amount_cents, balance_after_cents, description, created_at)
       VALUES (?, ?, 'deposit', ?, ?, 'Welcome credit', ?)`
    ).run(uuid(), walletId, balance, balance, now);
  }
  return id;
}

export async function seedDatabase(force = false): Promise<{ seeded: boolean }> {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (count > 0 && !force) return { seeded: false };

  const now = nowIso();

  // Admin + demo accounts (created outside the big transaction because hashing
  // is async; the volume is tiny so per-insert is fine).
  await createUser({
    email: env.ADMIN_EMAIL,
    name: "Sniser Admin",
    password: env.ADMIN_PASSWORD,
    role: "admin",
    verified: true,
  });
  const demoId = await createUser({
    email: "demo@sniser.io",
    name: "Demo Listener",
    password: "Password123",
    role: "viewer",
    verified: true,
    balanceCents: toCents(500),
  });
  void demoId;
  const collectorId = await createUser({
    email: "collector@sniser.io",
    name: "Ovi Collector",
    password: "Password123",
    role: "viewer",
    verified: true,
    balanceCents: toCents(200),
  });

  // Artists (each artist user gets an artist_profile).
  const artistUserId = new Map<string, string>();
  const artistProfileId = new Map<string, string>();
  for (const artist of ARTISTS) {
    const userId = await createUser({
      email: `${artist.handle}@artists.sniser.io`,
      name: artist.displayName,
      password: "Artist!2026",
      role: "artist",
      verified: true,
    });
    artistUserId.set(artist.handle, userId);
    const profileId = uuid();
    getDb()
      .prepare(
        `INSERT INTO artist_profiles (id, user_id, handle, display_name, bio, avatar_url, location, verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 1, ?, ?)`
      )
      .run(profileId, userId, artist.handle, artist.displayName, artist.bio, artist.location, now, now);
    artistProfileId.set(artist.handle, profileId);
  }

  // Provision the playable sample files before opening the write transaction
  // (filesystem work stays out of the DB transaction).
  const sampleMedia = provisionSampleMedia();

  // Content + tags + resale, all in one transaction for consistency.
  const contentIdByKey = new Map<string, string>();
  transaction(() => {
    const insertContent = db.prepare(
      `INSERT INTO content (id, artist_id, title, slug, category, description, price_cents, currency,
         cover_url, media_url, duration_sec, supply, status, plays, released_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'USDC', NULL, ?, ?, ?, 'published', ?, ?, ?, ?)`
    );
    const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
    const findTag = db.prepare("SELECT id FROM tags WHERE name = ?");
    const linkTag = db.prepare("INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)");

    const usedSlugs = new Set<string>();
    for (const item of CONTENT) {
      const profileId = artistProfileId.get(item.artist)!;
      const id = uuid();
      let slug = slugify(item.title) || item.key;
      while (usedSlugs.has(slug)) slug = `${slug}-${item.key}`;
      usedSlugs.add(slug);
      contentIdByKey.set(item.key, id);

      insertContent.run(
        id,
        profileId,
        item.title,
        slug,
        item.category,
        `${item.title} by ${ARTISTS.find((a) => a.handle === item.artist)!.displayName}.`,
        toCents(item.price),
        mediaUrlFor(item, sampleMedia),
        item.durationSec,
        item.supply ?? null,
        item.plays,
        new Date(`${item.releasedAt}T12:00:00Z`).toISOString(),
        now,
        now
      );
      for (const tag of item.tags) {
        insertTag.run(tag);
        const row = findTag.get(tag) as { id: number };
        linkTag.run(id, row.id);
      }
    }

    // Collector owns + lists the resale items.
    for (const listing of RESALE) {
      const contentId = contentIdByKey.get(listing.content)!;
      const original = CONTENT.find((c) => c.key === listing.content)!;
      const purchaseId = uuid();
      db.prepare(
        `INSERT INTO purchases (id, user_id, content_id, price_cents, fee_cents, acquired_via, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, 'primary', 'listed', ?, ?)`
      ).run(purchaseId, collectorId, contentId, toCents(original.price), now, now);
      db.prepare(
        `INSERT INTO resale_listings (id, purchase_id, seller_id, content_id, price_cents, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`
      ).run(uuid(), purchaseId, collectorId, contentId, toCents(listing.price), now);
    }
  });

  logger.info(
    { artists: ARTISTS.length, content: CONTENT.length, resale: RESALE.length },
    "database seeded"
  );
  return { seeded: true };
}
