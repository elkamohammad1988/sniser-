import crypto from "node:crypto";

/** RFC-4122 v4 uuid — primary keys across the schema. */
export function uuid(): string {
  return crypto.randomUUID();
}

/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Short, human-friendly reference like `SNS-7F3K9Q` for tickets/receipts. */
export function reference(prefix: string): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no easily-confused chars
  let out = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${prefix}-${out}`;
}

/** Pseudo custodial wallet address (0x + 40 hex) for the in-house ledger. */
export function walletAddress(): string {
  return `0x${crypto.randomBytes(20).toString("hex")}`;
}
