import { db, transactionImmediate } from "../../../db";
import { env } from "../../../config/env";
import { uuid } from "../../../utils/ids";
import { nowIso } from "../../../utils/datetime";
import { toUnits, feeCents, formatMoney } from "../../../utils/money";
import { signMediaToken } from "../../../utils/mediaToken";
import { mediaKindForFile, type MediaKind } from "../../../utils/media";
import { ApiError } from "../../../utils/ApiError";
import { logger } from "../../../utils/logger";
import { getOrCreateWallet, debit, credit } from "../../../services/wallet";
import { createNotification } from "../../../services/notifications";
import { writeAudit } from "../../../services/audit";
import { sendMail } from "../../../services/email";
import * as templates from "../../../services/emailTemplates";
import { findUserById } from "../../../services/users";

interface ContentForPurchase {
  id: string;
  title: string;
  slug: string;
  category: string;
  price_cents: number;
  currency: string;
  cover_url: string | null;
  media_url: string | null;
  status: string;
  supply: number | null;
  artist_id: string;
  artist_user_id: string;
  artist_name: string;
}

function loadContent(contentId: string): ContentForPurchase {
  const row = db
    .prepare(
      `SELECT c.id, c.title, c.slug, c.category, c.price_cents, c.currency, c.cover_url,
              c.media_url, c.status, c.supply, c.artist_id,
              ap.user_id AS artist_user_id, ap.display_name AS artist_name
       FROM content c JOIN artist_profiles ap ON ap.id = c.artist_id
       WHERE c.id = ?`
    )
    .get(contentId) as ContentForPurchase | undefined;
  if (!row) throw ApiError.notFound("Content not found");
  return row;
}

export interface PurchaseResult {
  purchase: PurchaseDto;
  balance: number;
}

export interface PurchaseDto {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  artist: string;
  category: string;
  coverUrl: string | null;
  price: number;
  fee: number;
  currency: string;
  acquiredVia: "primary" | "resale";
  status: string;
  createdAt: string;
  listing: { id: string; price: number; status: string } | null;
}

export function purchaseContent(userId: string, contentId: string, ip?: string | null): PurchaseResult {
  const content = loadContent(contentId);

  if (content.status !== "published") throw ApiError.badRequest("This release is not on sale");
  if (content.artist_user_id === userId) {
    throw ApiError.badRequest("You already own your own release");
  }

  const price = content.price_cents;
  const fee = feeCents(price, env.PLATFORM_FEE_BPS);
  const total = price + fee;
  const purchaseId = uuid();
  const now = nowIso();

  // The availability checks (ownership + supply) and the INSERT run inside a
  // single BEGIN IMMEDIATE transaction, so the "is it still available?" read and
  // the write that acts on it are one atomic, isolated unit — no oversell or
  // double-ownership even if two buyers hit this concurrently across processes.
  const newBalance = transactionImmediate(() => {
    const alreadyOwned = db
      .prepare(
        "SELECT 1 FROM purchases WHERE user_id = ? AND content_id = ? AND status IN ('active','listed')"
      )
      .get(userId, contentId);
    if (alreadyOwned) throw ApiError.conflict("You already own this pass");

    if (content.supply !== null) {
      // Count only passes in circulation. A 'resold' row is a spent pass whose
      // unit was transferred to a new owner (who holds an 'active' row), not an
      // extra unit of supply — counting it would let each resale wrongly consume
      // primary supply and prematurely mark the release sold out.
      const sold = (
        db
          .prepare(
            "SELECT COUNT(*) AS n FROM purchases WHERE content_id = ? AND status IN ('active','listed')"
          )
          .get(contentId) as { n: number }
      ).n;
      if (sold >= content.supply) throw ApiError.conflict("This release is sold out");
    }

    const buyerWallet = getOrCreateWallet(userId);
    // A free release (price 0) still grants a pass; skip the zero-amount ledger
    // moves, which the wallet primitives (correctly) reject as non-positive.
    const balanceAfter =
      total > 0
        ? debit(buyerWallet.id, total, "purchase", {
            referenceType: "content",
            referenceId: content.id,
            description: `Purchase — ${content.title}`,
          })
        : buyerWallet.balance_cents;
    if (price > 0) {
      // Artist receives the item price; the platform fee is retained.
      const artistWallet = getOrCreateWallet(content.artist_user_id);
      credit(artistWallet.id, price, "sale", {
        referenceType: "content",
        referenceId: content.id,
        description: `Sale — ${content.title}`,
      });
    }

    db.prepare(
      `INSERT INTO purchases (id, user_id, content_id, price_cents, fee_cents, acquired_via, status, created_at, updated_at)
       VALUES (@id, @userId, @contentId, @price, @fee, 'primary', 'active', @now, @now)`
    ).run({ id: purchaseId, userId, contentId: content.id, price, fee, now });

    return balanceAfter;
  });

  // Side effects after the money movement commits.
  createNotification({
    userId,
    type: "purchase",
    title: "Purchase confirmed",
    body: `${content.title} is now in your library.`,
    data: { contentId: content.id, slug: content.slug },
  });
  createNotification({
    userId: content.artist_user_id,
    type: "sale",
    title: "You made a sale",
    body: `${content.title} was purchased for ${formatMoney(price, content.currency)}.`,
    data: { contentId: content.id },
  });
  writeAudit({
    actorId: userId,
    action: "purchase.create",
    targetType: "content",
    targetId: content.id,
    ip,
    metadata: { price_cents: price, fee_cents: fee },
  });

  const buyer = findUserById(userId);
  if (buyer) {
    const receipt = templates.purchaseReceipt(
      buyer.name,
      content.title,
      formatMoney(total, content.currency),
      purchaseId.slice(0, 8).toUpperCase()
    );
    void sendMail({ ...receipt, to: buyer.email }).catch((err) =>
      logger.error({ err }, "receipt email failed")
    );
  }

  const purchase = getPurchaseDto(purchaseId);
  return { purchase, balance: toUnits(newBalance) };
}

interface PurchaseRow {
  id: string;
  content_id: string;
  price_cents: number;
  fee_cents: number;
  acquired_via: "primary" | "resale";
  status: string;
  created_at: string;
  title: string;
  slug: string;
  category: string;
  cover_url: string | null;
  currency: string;
  artist_name: string;
  listing_id: string | null;
  listing_price: number | null;
  listing_status: string | null;
}

const PURCHASE_SELECT = /* sql */ `
  SELECT p.id, p.content_id, p.price_cents, p.fee_cents, p.acquired_via, p.status, p.created_at,
         c.title, c.slug, c.category, c.cover_url, c.currency, ap.display_name AS artist_name,
         rl.id AS listing_id, rl.price_cents AS listing_price, rl.status AS listing_status
  FROM purchases p
  JOIN content c ON c.id = p.content_id
  JOIN artist_profiles ap ON ap.id = c.artist_id
  LEFT JOIN resale_listings rl ON rl.purchase_id = p.id AND rl.status = 'active'
`;

function mapPurchase(row: PurchaseRow): PurchaseDto {
  return {
    id: row.id,
    contentId: row.content_id,
    slug: row.slug,
    title: row.title,
    artist: row.artist_name,
    category: row.category,
    coverUrl: row.cover_url,
    price: toUnits(row.price_cents),
    fee: toUnits(row.fee_cents),
    currency: row.currency,
    acquiredVia: row.acquired_via,
    status: row.status,
    createdAt: row.created_at,
    listing:
      row.listing_id && row.listing_price !== null && row.listing_status
        ? { id: row.listing_id, price: toUnits(row.listing_price), status: row.listing_status }
        : null,
  };
}

export function getPurchaseDto(purchaseId: string): PurchaseDto {
  const row = db.prepare(`${PURCHASE_SELECT} WHERE p.id = ?`).get(purchaseId) as
    | PurchaseRow
    | undefined;
  if (!row) throw ApiError.notFound("Purchase not found");
  return mapPurchase(row);
}

export function listLibrary(userId: string): PurchaseDto[] {
  const rows = db
    .prepare(`${PURCHASE_SELECT} WHERE p.user_id = ? ORDER BY p.created_at DESC`)
    .all(userId) as PurchaseRow[];
  return rows.map(mapPurchase);
}

export interface AccessGrant {
  contentId: string;
  title: string;
  /** Short-lived, token-gated streaming URL (not the raw file path). */
  mediaUrl: string | null;
  category: string;
  /** How the player should render the media: "video" | "audio" | "download". */
  kind: MediaKind;
}

export function getAccess(userId: string, contentId: string): AccessGrant {
  const owns = db
    .prepare(
      "SELECT 1 FROM purchases WHERE user_id = ? AND content_id = ? AND status IN ('active','listed')"
    )
    .get(userId, contentId);
  if (!owns) throw ApiError.forbidden("You don't own this content");

  const content = db
    .prepare("SELECT id, title, media_url, category FROM content WHERE id = ?")
    .get(contentId) as
    | { id: string; title: string; media_url: string | null; category: string }
    | undefined;
  if (!content) throw ApiError.notFound("Content not found");

  db.prepare("UPDATE content SET plays = plays + 1 WHERE id = ?").run(contentId);

  // Ownership is proven here, so mint a short-lived token and hand back a
  // streaming URL instead of the raw file path. `kind` is derived from the
  // stored file so the player renders correctly even though the URL carries no
  // extension.
  let mediaUrl: string | null = null;
  let kind: MediaKind = "download";
  if (content.media_url) {
    const token = signMediaToken(content.id, userId);
    mediaUrl = `/media/${content.id}?token=${encodeURIComponent(token)}`;
    kind = mediaKindForFile(content.media_url);
  }

  return {
    contentId: content.id,
    title: content.title,
    mediaUrl,
    category: content.category,
    kind,
  };
}
