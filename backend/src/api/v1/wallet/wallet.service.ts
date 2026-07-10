import { transaction } from "../../../db";
import { toCents, toUnits } from "../../../utils/money";
import { writeAudit } from "../../../services/audit";
import { createNotification } from "../../../services/notifications";
import {
  getOrCreateWallet,
  credit,
  listTransactions,
  type WalletTxRow,
} from "../../../services/wallet";

export interface WalletSummary {
  address: string;
  balance: number;
  currency: string;
}

export interface WalletTxDto {
  id: string;
  type: WalletTxRow["type"];
  amount: number;
  balanceAfter: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

function toSummary(wallet: ReturnType<typeof getOrCreateWallet>): WalletSummary {
  return {
    address: wallet.address,
    balance: toUnits(wallet.balance_cents),
    currency: wallet.currency,
  };
}

export function getSummary(userId: string): WalletSummary {
  return toSummary(getOrCreateWallet(userId));
}

export function deposit(userId: string, amount: number, ip?: string | null): WalletSummary {
  const cents = toCents(amount);
  const result = transaction(() => {
    const wallet = getOrCreateWallet(userId);
    credit(wallet.id, cents, "deposit", {
      description: `Wallet top-up of ${amount.toFixed(2)} USDC`,
    });
    return getOrCreateWallet(userId);
  });
  createNotification({
    userId,
    type: "wallet_deposit",
    title: "Top-up received",
    body: `${amount.toFixed(2)} USDC was added to your wallet.`,
  });
  writeAudit({ actorId: userId, action: "wallet.deposit", targetType: "wallet", targetId: result.id, ip, metadata: { amount } });
  return toSummary(result);
}

export function toTxDto(row: WalletTxRow): WalletTxDto {
  return {
    id: row.id,
    type: row.type,
    amount: toUnits(row.amount_cents),
    balanceAfter: toUnits(row.balance_after_cents),
    description: row.description,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    createdAt: row.created_at,
  };
}

export function transactions(userId: string, limit = 50): WalletTxDto[] {
  const wallet = getOrCreateWallet(userId);
  return listTransactions(wallet.id, limit).map(toTxDto);
}
