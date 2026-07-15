import { describe, it, expect, beforeAll } from "vitest";
import i18n from "../i18n";
import en from "../locales/en.json";
import { validateEmail, validateRequired, validateMin, validatePassword } from "./validation";

// The validators resolve their user-facing messages through i18n. Initialise
// the instance with the English bundle so the assertions below check the real
// rendered copy (in the app the active locale drives the language instead).
beforeAll(async () => {
  if (!i18n.isInitialized) {
    await i18n.init({
      lng: "en",
      fallbackLng: "en",
      resources: { en: { translation: en } },
      interpolation: { escapeValue: false },
    });
  }
});

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
