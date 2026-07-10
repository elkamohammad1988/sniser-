import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { loadLocale } from ".";
import {
  DEFAULT_LOCALE,
  isLocaleCode,
  LOCALES,
  LocaleCode,
  LocaleMeta,
} from "./locales";
import { localizePath, stripLocale } from "./paths";

interface UseLocale {
  locale: LocaleCode;
  meta: LocaleMeta;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  /** Switch language, staying on the current page (search + hash preserved). */
  changeLocale: (next: LocaleCode) => Promise<void>;
  /** Prefix an internal path for the active locale. */
  localize: (to: string) => string;
}

export function useLocale(): UseLocale {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const locale: LocaleCode = isLocaleCode(i18n.language) ? i18n.language : DEFAULT_LOCALE;
  const meta = LOCALES[locale];

  const changeLocale = useCallback(
    async (next: LocaleCode) => {
      if (next === locale) return;
      // Preload the bundle so the destination renders fully translated (no flash
      // of English before the JSON lands). LocaleShell then commits the change.
      await loadLocale(next);
      const bare = stripLocale(location.pathname) + location.search + location.hash;
      navigate(localizePath(bare, next));
    },
    [locale, location.pathname, location.search, location.hash, navigate]
  );

  const localize = useCallback((to: string) => localizePath(to, locale), [locale]);

  return { locale, meta, dir: meta.dir, isRTL: meta.dir === "rtl", changeLocale, localize };
}
