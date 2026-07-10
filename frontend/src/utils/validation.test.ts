import { describe, it, expect } from "vitest";
import { validateEmail, validateRequired, validateMin, validatePassword } from "./validation";

describe("validateEmail", () => {
  it("rejects empty and malformed addresses", () => {
    expect(validateEmail("")).toMatch(/required/i);
    expect(validateEmail("nope")).toMatch(/valid/i);
    expect(validateEmail("a@b")).toMatch(/valid/i);
    expect(validateEmail("a@b.c")).toMatch(/valid/i); // TLD must be >= 2 chars
  });
  it("accepts a valid address (trimmed)", () => {
    expect(validateEmail("  user@example.com  ")).toBeNull();
  });
});

describe("validateRequired / validateMin", () => {
  it("enforces presence", () => {
    expect(validateRequired("   ")).toMatch(/required/i);
    expect(validateRequired("x")).toBeNull();
  });
  it("enforces minimum length on trimmed value", () => {
    expect(validateMin("ab", 3)).toMatch(/at least 3/);
    expect(validateMin("abc", 3)).toBeNull();
  });
});

describe("validatePassword", () => {
  it("requires length, an uppercase letter and a digit", () => {
    expect(validatePassword("")).toMatch(/required/i);
    expect(validatePassword("short1A")).toMatch(/8 characters/);
    expect(validatePassword("alllowercase1")).toMatch(/uppercase/i);
    expect(validatePassword("NoDigitsHere")).toMatch(/number/i);
    expect(validatePassword("Password123")).toBeNull();
  });
});
