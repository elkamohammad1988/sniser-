import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { toCents, toUnits, feeCents, formatMoney } from "../src/utils/money";

describe("money utils", () => {
  test("toCents rounds to integer cents", () => {
    assert.equal(toCents(10), 1000);
    assert.equal(toCents(9.99), 999);
    assert.equal(toCents(0.1), 10);
    // Floating point that must not drift (0.1 * 100 === 10.000000000000002).
    assert.equal(toCents(0.29), 29);
  });

  test("toUnits is the inverse for whole cents", () => {
    assert.equal(toUnits(1000), 10);
    assert.equal(toUnits(999), 9.99);
    assert.equal(toUnits(0), 0);
  });

  test("feeCents applies basis points with rounding", () => {
    // 2.5% of $10.00
    assert.equal(feeCents(1000, 250), 25);
    // 5% of $12.00
    assert.equal(feeCents(1200, 500), 60);
    // 0% fee
    assert.equal(feeCents(1000, 0), 0);
    // Rounding: 2.5% of $9.99 = 24.975 -> 25
    assert.equal(feeCents(999, 250), 25);
  });

  test("formatMoney renders two decimals with currency", () => {
    assert.equal(formatMoney(1025), "10.25 USDC");
    assert.equal(formatMoney(1000, "USD"), "10.00 USD");
  });
});
