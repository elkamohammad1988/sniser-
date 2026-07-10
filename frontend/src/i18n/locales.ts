/**
 * Single source of truth for the languages Sniser ships in.
 *
 * The URL is the authority for the active language (path-prefixed, English
 * unprefixed): `/about`, `/ar/about`, `/fr/about`, `/es/about`. Everything
 * else — <html lang/dir>, SEO hreflang, the switcher — derives from here.
 */

export type LocaleCode = "en" | "ar" | "fr" | "es";

export interface LocaleMeta {
  code: LocaleCode;
  /** Name in English (for aria/debugging). */
  name: string;
  /** Endonym shown in the language switcher. */
  nativeName: string;
  dir: "ltr" | "rtl";
  /** Value for <html lang>. */
  htmlLang: string;
  /** BCP-47 hreflang value. */
  hreflang: string;
  /** Open Graph locale (og:locale). */
  ogLocale: string;
}

export const LOCALES: Record<LocaleCode, LocaleMeta> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    dir: "ltr",
    htmlLang: "en",
    hreflang: "en",
    ogLocale: "en_US",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    dir: "rtl",
    htmlLang: "ar",
    hreflang: "ar",
    ogLocale: "ar_AR",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    dir: "ltr",
    htmlLang: "fr",
    hreflang: "fr",
    ogLocale: "fr_FR",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    dir: "ltr",
    htmlLang: "es",
    hreflang: "es",
    ogLocale: "es_ES",
  },
};

/** Ordered list used by the language switcher. English first. */
export const LOCALE_LIST: LocaleMeta[] = [LOCALES.en, LOCALES.ar, LOCALES.fr, LOCALES.es];

export const SUPPORTED_CODES = Object.keys(LOCALES) as LocaleCode[];

export const DEFAULT_LOCALE: LocaleCode = "en";

/** Locales that are NOT prefixed into the URL (only the default). */
export const UNPREFIXED_LOCALE: LocaleCode = "en";

/** Persists the last explicit choice so returning visitors land in their language. */
export const LOCALE_STORAGE_KEY = "sniser.lang";

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return !!value && (SUPPORTED_CODES as string[]).includes(value);
}

/** Maps a raw browser language tag (e.g. "fr-CA", "ar_EG") to a supported code. */
export function normalizeBrowserLang(tag: string | null | undefined): LocaleCode | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return isLocaleCode(base) ? base : null;
}
