import { useTranslation } from "react-i18next";
import { LocaleLink } from "./LocaleLink";
import Logo from "./Logo";
import SafeLink from "./SafeLink";
import { SOCIAL_LINKS } from "./socialLinks";
import { FOOTER_COLUMNS, SUPPORT_EMAIL, COMPANY_LEGAL_NAME } from "../../utils/constants";
import { isInternalRoute } from "../../utils/url";
import Container from "../layout/Container";
import AnimateIn from "./AnimateIn";

const SOCIAL_CLASS =
  "grid h-9 w-9 place-items-center rounded-md border border-white/10 text-white/70 hover:text-brand-green hover:border-brand-green hover:-translate-y-0.5 transition-all duration-200 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card aria-disabled:opacity-60 aria-disabled:cursor-not-allowed";

const COLUMN_LINK_CLASS =
  "text-sm text-white/55 hover:text-brand-green transition-colors duration-150 focus-visible:outline-none focus-visible:text-brand-green";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="bg-bg-card border-t border-white/5">
      <Container>
        <div className="py-14 lg:py-16">
          <AnimateIn>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:gap-12">
              {/* Brand column */}
              <div className="space-y-5">
                <Logo />
                <p className="text-sm text-white/55 max-w-xs leading-relaxed text-pretty">
                  {t("footer.tagline")}
                </p>
                <ul className="flex items-center gap-2.5" aria-label={t("a11y.socialLinks")}>
                  {SOCIAL_LINKS.map(({ label, Icon, href }) => (
                    <li key={label}>
                      <SafeLink href={href} aria-label={label} className={SOCIAL_CLASS}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </SafeLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Link columns */}
              {FOOTER_COLUMNS.map((column) => (
                <nav key={column.titleKey} aria-label={t(column.titleKey)}>
                  <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                    {t(column.titleKey)}
                  </h4>
                  <ul className="space-y-2.5">
                    {column.links.map((link) => {
                      const label = t(link.labelKey);
                      return (
                        <li key={link.labelKey}>
                          {link.disabled ? (
                            <SafeLink
                              href={link.href}
                              inert
                              className={`${COLUMN_LINK_CLASS} aria-disabled:opacity-50 aria-disabled:cursor-not-allowed`}
                              title={t("common.comingSoon")}
                            >
                              {label}
                            </SafeLink>
                          ) : isInternalRoute(link.href) ? (
                            <LocaleLink to={link.href} className={COLUMN_LINK_CLASS}>
                              {label}
                            </LocaleLink>
                          ) : (
                            <SafeLink href={link.href} className={COLUMN_LINK_CLASS}>
                              {label}
                            </SafeLink>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              ))}
            </div>
          </AnimateIn>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-white/40">
              © {year} {COMPANY_LEGAL_NAME}. {t("footer.rights")}
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-xs text-white/55 hover:text-brand-green transition-colors focus-visible:outline-none focus-visible:text-brand-green"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
