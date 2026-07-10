import { describe, it, expect } from "vitest";
import { isPlaceholderHref, isExternalUrl, isInternalRoute, isUnsafeHref } from "./url";

describe("isPlaceholderHref", () => {
  it("treats empty/#/nullish as placeholders", () => {
    expect(isPlaceholderHref("#")).toBe(true);
    expect(isPlaceholderHref("")).toBe(true);
    expect(isPlaceholderHref(undefined)).toBe(true);
    expect(isPlaceholderHref(null)).toBe(true);
  });
  it("treats real hrefs as non-placeholders", () => {
    expect(isPlaceholderHref("/browse")).toBe(false);
    expect(isPlaceholderHref("https://x.com")).toBe(false);
  });
});

describe("isExternalUrl", () => {
  it("matches absolute http(s) only", () => {
    expect(isExternalUrl("https://x.com")).toBe(true);
    expect(isExternalUrl("http://x.com")).toBe(true);
    expect(isExternalUrl("/browse")).toBe(false);
    expect(isExternalUrl("//x.com")).toBe(false);
  });
});

describe("isInternalRoute", () => {
  it("matches app paths but not protocol-relative", () => {
    expect(isInternalRoute("/browse")).toBe(true);
    expect(isInternalRoute("//evil.com")).toBe(false);
    expect(isInternalRoute("https://x.com")).toBe(false);
  });
});

describe("isUnsafeHref (XSS scheme guard)", () => {
  it("flags script-executing / smuggling schemes", () => {
    expect(isUnsafeHref("javascript:alert(1)")).toBe(true);
    expect(isUnsafeHref("JavaScript:alert(1)")).toBe(true);
    expect(isUnsafeHref("data:text/html,<script>alert(1)</script>")).toBe(true);
    expect(isUnsafeHref("vbscript:msgbox(1)")).toBe(true);
    expect(isUnsafeHref("file:///etc/passwd")).toBe(true);
  });
  it("defeats whitespace/control-char obfuscation of the scheme", () => {
    expect(isUnsafeHref("  javascript:alert(1)")).toBe(true);
    expect(isUnsafeHref("java\tscript:alert(1)")).toBe(true);
    expect(isUnsafeHref("java\nscript:alert(1)")).toBe(true);
  });
  it("allows safe schemes and relative/absolute app URLs", () => {
    expect(isUnsafeHref("https://x.com")).toBe(false);
    expect(isUnsafeHref("/browse")).toBe(false);
    expect(isUnsafeHref("mailto:a@b.com")).toBe(false);
    expect(isUnsafeHref("#section")).toBe(false);
    expect(isUnsafeHref("")).toBe(false);
    expect(isUnsafeHref(null)).toBe(false);
  });
});
