/**
 * i18next bootstrap.
 *
 * English ships in the main bundle (it is the fallback and the most common
 * language); Arabic / French / Spanish are code-split and fetched on demand the
 * first time they're needed, so visitors only pay for the language they use.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import {
  DEFAULT_LOCALE,
  LocaleCode,
  SUPPORTED_CODES,
} from "./locales";

/** Lazy loaders for the non-default locales (Vite code-splits each JSON). */
const LOADERS: Record<Exclude<LocaleCode, "en">, () => Promise<{ default: object }>> = {
  ar: () => import("../locales/ar.json"),
  fr: () => import("../locales/fr.json"),
  es: () => import("../locales/es.json"),
};

const loaded = new Set<LocaleCode>(["en"]);

/** Ensures a locale's resource bundle is registered before it's shown. */
export async function loadLocale(code: LocaleCode): Promise<void> {
  if (loaded.has(code)) return;
  const loader = LOADERS[code as Exclude<LocaleCode, "en">];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(code, "translation", mod.default, true, true);
  loaded.add(code);
}

/**
 * Initialises i18next for a known starting locale. Callers preload the locale's
 * bundle first (see `main.tsx`) so the first paint is already translated.
 */
export function initI18n(initial: LocaleCode) {
  return i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: initial,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_CODES,
    defaultNS: "translation",
    interpolation: { escapeValue: false }, // React already escapes
    returnEmptyString: false,
    react: { useSuspense: false },
  });
}

export default i18n;
