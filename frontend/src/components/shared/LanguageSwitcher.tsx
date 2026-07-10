import { useTranslation } from "react-i18next";
import Dropdown, { DropdownItem } from "./Dropdown";
import { useLocale } from "../../i18n/useLocale";
import { LOCALE_LIST, LocaleCode } from "../../i18n/locales";
import { cn } from "../../utils/cn";

/** Globe glyph — decorative, mirrors fine in RTL. */
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 5 5 9-11" />
    </svg>
  );
}

interface Props {
  /** `bar` = compact icon button (navbar); `list` = full-width rows (mobile drawer). */
  variant?: "bar" | "list";
  className?: string;
}

/**
 * Language switcher. Reads/writes the active locale via the URL (English
 * unprefixed) — see `useLocale`. Preloads the target bundle before navigating
 * so the destination renders fully translated.
 */
export default function LanguageSwitcher({ variant = "bar", className }: Props) {
  const { t } = useTranslation();
  const { locale, meta, changeLocale } = useLocale();

  if (variant === "list") {
    return (
      <div className={cn("grid grid-cols-2 gap-1", className)} role="group" aria-label={t("language.select")}>
        {LOCALE_LIST.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              lang={l.htmlLang}
              onClick={() => void changeLocale(l.code as LocaleCode)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:bg-white/5",
                active ? "bg-brand-green/15 text-brand-green" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="truncate">{l.nativeName}</span>
              {active && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Dropdown
      label={t("language.select")}
      align="right"
      widthClass="w-44"
      trigger={(toggle, isOpen) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={t("language.label")}
          title={t("language.label")}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <GlobeIcon className="h-4 w-4" />
          <span className="uppercase tracking-wide text-xs font-semibold">{meta.code}</span>
        </button>
      )}
    >
      {LOCALE_LIST.map((l) => {
        const active = l.code === locale;
        return (
          <DropdownItem
            key={l.code}
            onSelect={() => void changeLocale(l.code as LocaleCode)}
            icon={active ? <CheckIcon className="h-3.5 w-3.5 text-brand-green" /> : <span className="h-3.5 w-3.5" />}
          >
            <span lang={l.htmlLang} className={cn(active && "text-brand-green")}>{l.nativeName}</span>
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
}
