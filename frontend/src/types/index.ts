/** Shared domain types used across components. */

export interface NavLink {
  /** i18n key resolved at render (see `locales/*.json`). */
  labelKey: string;
  href: string;
}

export interface FooterColumn {
  /** i18n key for the column heading. */
  titleKey: string;
  links: { labelKey: string; href: string; disabled?: boolean }[];
}

/** Tone of a section/step block — drives all variant-aware styling. */
export type SectionVariant = "dark" | "green" | "light";
