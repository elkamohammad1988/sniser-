import { describe, it, expect } from "vitest";
import { localeFromPath, stripLocale, localizePath } from "./paths";
import { normalizeBrowserLang } from "./locales";

describe("localeFromPath", () => {
  it("reads the leading locale segment, defaulting to en", () => {
    expect(localeFromPath("/ar/about")).toBe("ar");
    expect(localeFromPath("/fr")).toBe("fr");
    expect(localeFromPath("/about")).toBe("en");
    expect(localeFromPath("/")).toBe("en");
  });
});

describe("stripLocale", () => {
  it("removes a leading locale and always returns a rooted path", () => {
    expect(stripLocale("/ar/about")).toBe("/about");
    expect(stripLocale("/fr")).toBe("/");
    expect(stripLocale("/about")).toBe("/about");
    expect(stripLocale("")).toBe("/");
  });
});

describe("localizePath", () => {
  it("prefixes non-default locales and keeps English unprefixed", () => {
    expect(localizePath("/about", "ar")).toBe("/ar/about");
    expect(localizePath("/about", "en")).toBe("/about");
    expect(localizePath("/", "ar")).toBe("/ar");
  });
  it("never double-prefixes an already-localized path", () => {
    expect(localizePath("/ar/about", "fr")).toBe("/fr/about");
    expect(localizePath("/fr/about", "en")).toBe("/about");
  });
  it("preserves query/hash and leaves external/anchor links untouched", () => {
    expect(localizePath("/browse?tab=audio", "ar")).toBe("/ar/browse?tab=audio");
    expect(localizePath("https://x.com", "ar")).toBe("https://x.com");
    expect(localizePath("#section", "ar")).toBe("#section");
    expect(localizePath("mailto:a@b.com", "fr")).toBe("mailto:a@b.com");
  });
});

describe("normalizeBrowserLang", () => {
  it("maps regional tags to a supported base code", () => {
    expect(normalizeBrowserLang("fr-CA")).toBe("fr");
    expect(normalizeBrowserLang("ar_EG")).toBe("ar");
    expect(normalizeBrowserLang("en-US")).toBe("en");
    expect(normalizeBrowserLang("de-DE")).toBeNull();
    expect(normalizeBrowserLang(null)).toBeNull();
  });
});
