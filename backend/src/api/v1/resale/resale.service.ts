import { db, transactionImmediate } from "../../../db";
import { env } from "../../../config/env";
import { uuid } from "../../../utils/ids";
import { nowIso } from "../../../utils/datetime";
import { toCents, toUnits, feeCents, formatMoney } from "../../../utils/money";
import { ApiError } from "../../../utils/ApiError";
import { logger } from "../../../utils/logger";
import { catalogCache } from "../../../utils/cache";
import { getOrCreateWallet, debit, credit } from "../../../services/wallet";
import { createNotification } from "../../../services/notifications";
import { writeAudit } from "../../../services/audit";
import { sendMail } from "../../../services/email";
import * as templates from "../../../services/emailTemplates";
import { findUserById } from "../../../services/users";

export interface ListingDto {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface ListingRow {
  id: string;
  content_id: string;
  price_cents: number;
  status: string;
  created_at: string;
  slug: string;
  title: string;
  cover_url: string | null;
  currency: string;
}

const LISTING_SELECT = /* sql */ `
  SELECT rl.id, rl.content_id, rl.price_cents, rl.status, rl.created_at,
         c.slug, c.title, c.cover_url, c.currency
  FROM resale_listings rl JOIN content c ON c.id = rl.content_id
`;

function mapListing(row: ListingRow): ListingDto {
  return {
    id: row.id,
    contentId: row.content_id,
    slug: row.slug,
    title: row.title,
    coverUrl: row.cover_url,
    price: toUnits(row.price_cents),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
  };
}

interface PurchaseOwnRow {
  id: string;
  user_id: string;
  content_id: string;
  status: string;
}

export function createListing(
  userId: string,
  purchaseId: string,
  price: number,
  ip?: string | null
): ListingDto {
  const purchase = db
    .prepare("SELECT id, user_id, content_id, status FROM purchases WHERE id = ?")
    .get(purchaseId) as PurchaseOwnRow | undefined;

  if (!purchase || purchase.user_id !== userId) throw ApiError.notFound("Pass not found");
  if (purchase.status === "listed") throw ApiError.conflict("This pass is already listed");
  if (purchase.status !== "active") throw ApiError.badRequest("This pass can't be listed");

  const priceCents = toCents(price);
  const now = nowIso();

  const listingId = transactionImmediate(() => {
    // Atomically move the pass to 'listed'. If a concurrent action already
    // changed its state, changes === 0 and we abort before touching the listing.
    const moved = db
      .prepare("UPDATE purchases SET status = 'listed', updated_at = ? WHERE id = ? AND status = 'active'")
      .run(now, purchaseId);
    if (moved.changes === 0) throw ApiError.conflict("This pass can't be listed");

    // `resale_listings.purchase_id` is UNIQUE, so a pass that was listed →
    // cancelled → re-listed already has a (cancelled) row. Reactivate it instead
    // of inserting a duplicate, which would violate the unique constraint.
    const existing = db
      .prepare("SELECT id FROM resale_listings WHERE purchase_id = ?")
      .get(purchaseId) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE resale_listings
           SET seller_id = @sellerId, content_id = @contentId, price_cents = @priceCents,
               status = 'active', buyer_id = NULL, sold_at = NULL, created_at = @now
         WHERE id = @id`
      ).run({ id: existing.id, sellerId: userId, contentId: purchase.content_id, priceCents, now });
      return existing.id;
    }

    const id = uuid();
    db.prepare(
      `INSERT INTO resale_listings (id, purchase_id, seller_id, content_id, price_cents, status, created_at)
       VALUES (@id, @purchaseId, @sellerId, @contentId, @priceCents, 'active', @now)`
    ).run({ id, purchaseId, sellerId: userId, contentId: purchase.content_id, priceCents, now });
    return id;
  });

  catalogCache.invalidate();
  writeAudit({ actorId: userId, action: "resale.list", targetType: "listing", targetId: listingId, ip, metadata: { price } });

  const row = db.prepare(`${LISTING_SELECT} WHERE rl.id = ?`).get(listingId) as ListingRow;
  return mapListing(row);
}

export function cancelListing(userId: string, listingId: string, ip?: string | null): void {
  const listing = db
    .prepare("SELECT id, seller_id, purchase_id, status FROM resale_listings WHERE id = ?")
    .get(listingId) as
    | { id: string; seller_id: string; purchase_id: string; status: string }
    | undefined;

  if (!listing || listing.seller_id !== userId) throw ApiError.notFound("Listing not found");
  if (listing.status !== "active") throw ApiError.badRequest("This listing is no longer active");

  const now = nowIso();
  transactionImmediate(() => {
    // Conditional so a concurrent buy that already flipped the listing to 'sold'
    // can't be undone here (which would hand the pass back to a seller who was
    // already paid). changes === 0 means someone else won the race.
    const cancelled = db
      .prepare("UPDATE resale_listings SET status = 'cancelled' WHERE id = ? AND status = 'active'")
      .run(listingId);
    if (cancelled.changes === 0) throw ApiError.conflict("This listing is no longer active");
    db.prepare("UPDATE purchases SET status = 'active', updated_at = ? WHERE id = ?").run(
      now,
      listing.purchase_id
    );
  });
  catalogCache.invalidate();
  writeAudit({ actorId: userId, action: "resale.cancel", targetType: "listing", targetId: listingId, ip });
}

interface FullListingRow {
  id: string;
  purchase_id: string;
  seller_id: string;
  content_id: string;
  price_cents: number;
  status: string;
  title: string;
  slug: string;
  currency: string;
}

export interface BuyResult {
  purchaseId: string;
  balance: number;
}

export function buyListing(userId: string, listingId: string, ip?: string | null): BuyResult {
  const listing = db
    .prepare(
      `SELECT rl.id, rl.purchase_id, rl.seller_id, rl.content_id, rl.price_cents, rl.status,
              c.title, c.slug, c.currency
       FROM resale_listings rl JOIN content c ON c.id = rl.content_id
       WHERE rl.id = ?`
    )
    .get(listingId) as FullListingRow | undefined;

  if (!listing || listing.status !== "active") throw ApiError.notFound("Listing not available");
  if (listing.seller_id === userId) throw ApiError.badRequest("You can't buy your own listing");

  const price = listing.price_cents;
  const commission = feeCents(price, env.RESALE_FEE_BPS);
  const sellerNet = price - commission;
  const newPurchaseId = uuid();
  const now = nowIso();

  const balanceAfter = transactionImmediate(() => {
    // Atomically claim the listing. If a concurrent buy or cancel already moved
    // it out of 'active', changes === 0 and we abort before any money or pass
    // moves — no double-sell and no paying the seller twice.
    const claimed = db
      .prepare(
        "UPDATE resale_listings SET status = 'sold', buyer_id = ?, sold_at = ? WHERE id = ? AND status = 'active'"
      )
      .run(userId, now, listing.id);
    if (claimed.changes === 0) throw ApiError.conflict("This listing is no longer available");

    const alreadyOwned = db
      .prepare(
        "SELECT 1 FROM purchases WHERE user_id = ? AND content_id = ? AND status IN ('active','listed')"
      )
      .get(userId, listing.content_id);
    if (alreadyOwned) throw ApiError.conflict("You already own this pass");

    const buyerWallet = getOrCreateWallet(userId);
    const balance = debit(buyerWallet.id, price, "purchase", {
      referenceType: "listing",
      referenceId: listing.id,
      description: `Resale purchase — ${listing.title}`,
    });
    if (sellerNet > 0) {
      const sellerWallet = getOrCreateWallet(listing.seller_id);
      credit(sellerWallet.id, sellerNet, "sale", {
        referenceType: "listing",
        referenceId: listing.id,
        description: `Resale sale — ${listing.title}`,
      });
    }

    // Transfer: seller's pass is spent, buyer gets a fresh pass.
    db.prepare("UPDATE purchases SET status = 'resold', updated_at = ? WHERE id = ?").run(
      now,
      listing.purchase_id
    );
    db.prepare(
      `INSERT INTO purchases (id, user_id, content_id, price_cents, fee_cents, acquired_via, status, created_at, updated_at)
       VALUES (@id, @userId, @contentId, @price, @commission, 'resale', 'active', @now, @now)`
    ).run({ id: newPurchaseId, userId, contentId: listing.content_id, price, commission, now });

    return balance;
  });

  catalogCache.invalidate();

  createNotification({
    userId,
    type: "purchase",
    title: "Resale purchase confirmed",
    body: `${listing.title} is now in your library.`,
    data: { contentId: listing.content_id, slug: listing.slug },
  });
  createNotification({
    userId: listing.seller_id,
    type: "sale",
    title: "Your listing sold",
    body: `${listing.title} sold — ${formatMoney(sellerNet, listing.currency)} credited to your wallet.`,
    data: { contentId: listing.content_id },
  });
  writeAudit({
    actorId: userId,
    action: "resale.buy",
    targetType: "listing",
    targetId: listing.id,
    ip,
    metadata: { price_cents: price, commission_cents: commission },
  });

  const seller = findUserById(listing.seller_id);
  if (seller) {
    const mail = templates.saleNotification(
      seller.name,
      listing.title,
      formatMoney(sellerNet, listing.currency)
    );
    void sendMail({ ...mail, to: seller.email }).catch((err) =>
      logger.error({ err }, "sale email failed")
    );
  }

  return { purchaseId: newPurchaseId, balance: toUnits(balanceAfter) };
}

export function listMine(userId: string): ListingDto[] {
  const rows = db
    .prepare(`${LISTING_SELECT} WHERE rl.seller_id = ? ORDER BY rl.created_at DESC`)
    .all(userId) as ListingRow[];
  return rows.map(mapListing);
}
