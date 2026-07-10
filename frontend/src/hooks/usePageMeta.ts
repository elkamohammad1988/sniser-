import { useEffect } from "react";
import i18n from "../i18n";
import { LOCALE_LIST, LOCALES, DEFAULT_LOCALE, isLocaleCode, LocaleCode } from "../i18n/locales";
import { localizePath } from "../i18n/paths";

interface PageMeta {
  title: string;
  description?: string;
  /** Path-only canonical (e.g. "/viewer"). Combined with window.location.origin. */
  canonicalPath?: string;
}

const DEFAULT_DESCRIPTION =
  "Sniser is the platform that pays artists for their music. Exclusive releases, full-service production, and fan-owned content on the blockchain.";

/**
 * Lightweight per-route document head updater. Avoids pulling in a full
 * helmet/head library — we only need title, description, canonical, and the
 * multilingual `og:locale` + `hreflang` alternates here.
 *
 * No cleanup on title/description: with `AnimatePresence mode="wait"` the
 * previous page unmounts AFTER the new one mounts, so a cleanup that restored
 * the old title would overwrite whatever the new page just set. Whichever page
 * mounts last wins.
 */
export function usePageMeta({ title, description, canonicalPath }: PageMeta) {
  useEffect(() => {
    document.title = title;

    const desc = description ?? DEFAULT_DESCRIPTION;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", desc);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", desc);

    const active: LocaleCode = isLocaleCode(i18n.language) ? i18n.language : DEFAULT_LOCALE;
    upsertMeta("property", "og:locale", LOCALES[active].ogLocale);

    if (canonicalPath) {
      const origin = window.location.origin;
      const href = `${origin}${localizePath(canonicalPath, active)}`;
      upsertLink("canonical", href);
      upsertMeta("property", "og:url", href);

      // hreflang alternates: one per language for this route + x-default (en).
      const alts = LOCALE_LIST.map((l) => ({
        hreflang: l.hreflang,
        href: `${origin}${localizePath(canonicalPath, l.code)}`,
      }));
      alts.push({
        hreflang: "x-default",
        href: `${origin}${localizePath(canonicalPath, DEFAULT_LOCALE)}`,
      });
      syncAlternates(alts);
    }
  }, [title, description, canonicalPath]);
}

function upsertMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/** Replaces the managed set of <link rel="alternate" hreflang> tags. */
function syncAlternates(alts: { hreflang: string; href: string }[]) {
  document.head
    .querySelectorAll("link[data-i18n-alt]")
    .forEach((el) => el.remove());
  for (const alt of alts) {
    const el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", alt.hreflang);
    el.setAttribute("href", alt.href);
    el.setAttribute("data-i18n-alt", "");
    document.head.appendChild(el);
  }
}
