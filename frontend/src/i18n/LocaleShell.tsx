import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import i18n, { loadLocale } from ".";
import { LOCALES } from "./locales";
import { localeFromPath } from "./paths";
import PageFallback from "../components/layout/PageFallback";

/**
 * Commits the URL's locale to the running app.
 *
 * The first path segment is the language authority (English unprefixed). On
 * every navigation this:
 *   1. loads the target locale's bundle (code-split JSON) if not already loaded,
 *   2. switches i18n to it,
 *   3. mirrors it onto `<html lang / dir>` so RTL and SEO stay correct.
 *
 * Rendering of the routed content is gated until the target bundle is live, so
 * a page never flashes untranslated keys before its language lands. The initial
 * locale is preloaded in `main.tsx`, so the very first paint is already ready.
 */
export default function LocaleShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const target = localeFromPath(pathname);
  const [ready, setReady] = useState(i18n.language === target);

  // Keep <html lang/dir> in sync with the active locale (also drives RTL).
  useEffect(() => {
    const meta = LOCALES[target];
    const root = document.documentElement;
    root.lang = meta.htmlLang;
    root.dir = meta.dir;
  }, [target]);

  // Load + switch language when the URL locale changes.
  useEffect(() => {
    if (i18n.language === target) {
      setReady(true);
      return;
    }
    let active = true;
    setReady(false);
    loadLocale(target)
      .then(() => i18n.changeLanguage(target))
      .catch(() => {
        // A locale bundle can fail to load (offline, a dropped chunk request).
        // Degrade to the already-active language rather than hanging on the
        // fallback spinner forever.
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [target]);

  if (!ready) return <PageFallback />;
  return <>{children}</>;
}
