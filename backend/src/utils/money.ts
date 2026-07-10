/**
 * All monetary values are stored and computed as integer cents. These helpers
 * convert to/from the whole-currency-unit representation the client uses and
 * apply fees using integer math (banker-safe rounding of the fee only).
 */

export function toCents(units: number): number {
  return Math.round(units * 100);
}

export function toUnits(cents: number): number {
  return Math.round(cents) / 100;
}

/** Fee in cents from an amount in cents, given basis points (250 = 2.5%). */
export function feeCents(amountCents: number, bps: number): number {
  return Math.round((amountCents * bps) / 10_000);
}

export function formatMoney(cents: number, currency = "USDC"): string {
  return `${toUnits(cents).toFixed(2)} ${currency}`;
}
