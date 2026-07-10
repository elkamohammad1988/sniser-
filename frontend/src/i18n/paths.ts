/**
 * URL <-> locale helpers. The first path segment carries the language for every
 * non-default locale; the default (English) is unprefixed.
 *
 *   "/about"        (en)
 *   "/ar/about"     (ar)
 *   "/fr/browse?x"  (fr, query preserved)
 */

import {
  DEFAULT_LOCALE,
  isLocaleCode,
  LocaleCode,
  UNPREFIXED_LOCALE,
} from "./locales";

/** Splits a URL-ish string into its path and its `?query#hash` remainder. */
function splitPath(to: string): { path: string; suffix: string } {
  const match = to.match(/^([^?#]*)([?#].*)?$/);
  return { path: match?.[1] || "", suffix: match?.[2] || "" };
}

/** The locale implied by a pathname's first segment (default if none). */
export function localeFromPath(pathname: string): LocaleCode {
  const seg = pathname.split("/")[1];
  return isLocaleCode(seg) ? seg : DEFAULT_LOCALE;
}

/**
 * Removes a leading locale segment, returning a clean, unprefixed path that
 * always starts with "/". `"/ar/about" -> "/about"`, `"/fr" -> "/"`.
 */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (isLocaleCode(parts[1])) {
    const rest = parts.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

/**
 * Rewrites an internal path (optionally already prefixed) into the given
 * locale. External/relative links and anchors are returned untouched.
 */
export function localizePath(to: string, locale: LocaleCode): string {
  if (!to || !to.startsWith("/")) return to; // external, mailto:, #anchor, relative
  const { path, suffix } = splitPath(to);
  const bare = stripLocale(path); // guard against double-prefixing
  if (locale === UNPREFIXED_LOCALE) {
    return `${bare}${suffix}`;
  }
  const tail = bare === "/" ? "" : bare;
  return `/${locale}${tail}${suffix}`;
}
