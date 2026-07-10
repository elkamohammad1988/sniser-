import type { NavLink, FooterColumn } from "../types";

/**
 * Primary navigation tabs. Each one routes into the Browse page with a
 * category pre-selected — the URL is the single source of truth so deep links
 * and shares work without extra plumbing.
 */
export const NAV_LINKS: NavLink[] = [
  { labelKey: "nav.video", href: "/browse?type=video" },
  { labelKey: "nav.audio", href: "/browse?type=audio" },
  { labelKey: "nav.original", href: "/browse?type=original" },
  { labelKey: "nav.resale", href: "/browse?type=resale" },
];

/**
 * Footer link columns. Routes are real where the page exists; the placeholder
 * press-kit link intentionally stays as a hash. Text is resolved from i18n keys
 * at render time (see `locales/*.json`).
 */
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    titleKey: "footer.product.title",
    links: [
      { labelKey: "footer.product.browse", href: "/browse" },
      { labelKey: "footer.product.viewer", href: "/viewer" },
      { labelKey: "footer.product.forArtists", href: "/" },
      { labelKey: "footer.product.faq", href: "/faq" },
    ],
  },
  {
    titleKey: "footer.company.title",
    links: [
      { labelKey: "footer.company.about", href: "/about" },
      { labelKey: "footer.company.contact", href: "/contact" },
      { labelKey: "footer.company.press", href: "#", disabled: true },
      { labelKey: "footer.company.terms", href: "/terms" },
      { labelKey: "footer.company.privacy", href: "/privacy" },
    ],
  },
];

export const SUPPORT_EMAIL = "support@sniser.com";
export const COMPANY_LEGAL_NAME = "Sniser Ltd";
