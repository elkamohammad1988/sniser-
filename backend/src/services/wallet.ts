import { db } from "../db";
import { uuid, walletAddress } from "../utils/ids";
import { nowIso } from "../utils/datetime";
import { toUnits } from "../utils/money";
import { ApiError } from "../utils/ApiError";

/**
 * The custodial wallet ledger. Balances live on the `wallets` row; every change
 * writes an append-only `wallet_transactions` entry that snapshots the running
 * balance. Callers MUST wrap multi-step money movements (e.g. a purchase that
 * debits a buyer and credits a seller) in a single `transaction()` so the whole
 * transfer commits or rolls back atomically.
 */

export type LedgerType = "deposit" | "purchase" | "sale" | "fee" | "refund" | "payout";

export interface WalletRow {
  id: string;
  user_id: string;
  balance_cents: number;
  currency: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTxRow {
  id: string;
  wallet_id: string;
  type: LedgerType;
  amount_cents: number;
  balance_after_cents: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface LedgerMeta {
  referenceType?: string;
  referenceId?: string;
  description: string;
}

export function getWalletByUser(userId: string): WalletRow | undefined {
  return db.prepare("SELECT * FROM wallets WHERE user_id = ?").get(userId) as
    | WalletRow
    | undefined;
}

export function getOrCreateWallet(userId: string): WalletRow {
  const existing = getWalletByUser(userId);
  if (existing) return existing;
  const now = nowIso();
  const row: WalletRow = {
    id: uuid(),
    user_id: userId,
    balance_cents: 0,
    currency: "USDC",
    address: walletAddress(),
    created_at: now,
    updated_at: now,
  };
  db.prepare(
    `INSERT INTO wallets (id, user_id, balance_cents, currency, address, created_at, updated_at)
     VALUES (@id, @user_id, @balance_cents, @currency, @address, @created_at, @updated_at)`
  ).run(row);
  return row;
}

function record(
  walletId: string,
  type: LedgerType,
  amountCents: number,
  balanceAfter: number,
  meta: LedgerMeta
): WalletTxRow {
  const tx: WalletTxRow = {
    id: uuid(),
    wallet_id: walletId,
    type,
    amount_cents: amountCents,
    balance_after_cents: balanceAfter,
    reference_type: meta.referenceType ?? null,
    reference_id: meta.referenceId ?? null,
    description: meta.description,
    created_at: nowIso(),
  };
  db.prepare(
    `INSERT INTO wallet_transactions
       (id, wallet_id, type, amount_cents, balance_after_cents, reference_type, reference_id, description, created_at)
     VALUES (@id, @wallet_id, @type, @amount_cents, @balance_after_cents, @reference_type, @reference_id, @description, @created_at)`
  ).run(tx);
  return tx;
}

export function credit(
  walletId: string,
  amountCents: number,
  type: LedgerType,
  meta: LedgerMeta
): number {
  if (amountCents <= 0) throw ApiError.badRequest("Credit amount must be positive");
  const now = nowIso();
  const result = db
    .prepare(
      "UPDATE wallets SET balance_cents = balance_cents + ?, updated_at = ? WHERE id = ?"
    )
    .run(amountCents, now, walletId);
  if (result.changes === 0) throw ApiError.notFound("Wallet not found");
  const wallet = db.prepare("SELECT balance_cents FROM wallets WHERE id = ?").get(walletId) as {
    balance_cents: number;
  };
  record(walletId, type, amountCents, wallet.balance_cents, meta);
  return wallet.balance_cents;
}

export function debit(
  walletId: string,
  amountCents: number,
  type: LedgerType,
  meta: LedgerMeta
): number {
  if (amountCents <= 0) throw ApiError.badRequest("Debit amount must be positive");
  const now = nowIso();
  // Conditional update guarantees no overdraft even under concurrency.
  const result = db
    .prepare(
      `UPDATE wallets SET balance_cents = balance_cents - ?, updated_at = ?
       WHERE id = ? AND balance_cents >= ?`
    )
    .run(amountCents, now, walletId, amountCents);
  if (result.changes === 0) {
    const wallet = db.prepare("SELECT balance_cents FROM wallets WHERE id = ?").get(walletId) as
      | { balance_cents: number }
      | undefined;
    if (!wallet) throw ApiError.notFound("Wallet not found");
    throw new ApiError(
      400,
      `Insufficient balance. You have ${toUnits(wallet.balance_cents).toFixed(2)} USDC.`,
      "INSUFFICIENT_FUNDS"
    );
  }
  const wallet = db.prepare("SELECT balance_cents FROM wallets WHERE id = ?").get(walletId) as {
    balance_cents: number;
  };
  record(walletId, type, -amountCents, wallet.balance_cents, meta);
  return wallet.balance_cents;
}

export function listTransactions(walletId: string, limit = 50): WalletTxRow[] {
  return db
    .prepare(
      "SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?"
    )
    .all(walletId, limit) as WalletTxRow[];
}
