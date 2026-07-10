/** URL/href helpers shared by every link-rendering component. */

/** Treat empty or "#" hrefs as placeholders that should not navigate. */
export function isPlaceholderHref(href: string | undefined | null): boolean {
  return !href || href === "#";
}

/** True for absolute http(s) URLs — used to opt anchors into _blank + safe rel. */
export function isExternalUrl(href: string | undefined | null): boolean {
  return !!href && /^https?:\/\//i.test(href);
}

/** True for in-app SPA routes like "/viewer" (not protocol-relative "//"). */
export function isInternalRoute(href: string | undefined | null): boolean {
  return !!href && href.startsWith("/") && !href.startsWith("//");
}

/**
 * True for hrefs whose scheme can execute script or smuggle content
 * (`javascript:`, `data:`, `vbscript:`, `file:`). Such a value must never be
 * rendered as a live navigation target — even if it arrives from API or
 * catalog data. ASCII whitespace and control characters are stripped first
 * because browsers tolerate them inside a scheme (e.g. a tab in `java<TAB>script:`).
 */
export function isUnsafeHref(href: string | undefined | null): boolean {
  if (!href) return false;
  const normalized = Array.from(href)
    .filter((ch) => ch.charCodeAt(0) > 0x20)
    .join("")
    .toLowerCase();
  return /^(?:javascript|data|vbscript|file):/.test(normalized);
}
