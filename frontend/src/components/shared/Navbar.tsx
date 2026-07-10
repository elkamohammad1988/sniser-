import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, m } from "framer-motion";
import { LocaleLink, LocaleNavLink } from "./LocaleLink";
import Logo from "./Logo";
import Button from "./Button";
import IconButton from "./IconButton";
import UserMenu from "./UserMenu";
import WalletPill from "./WalletPill";
import LanguageSwitcher from "./LanguageSwitcher";
import { ArrowUpRight } from "./Icons";
import { NAV_LINKS } from "../../utils/constants";
import { useModal } from "./ModalProvider";
import { useSession } from "./SessionProvider";
import { useScrolled } from "../../hooks/useScrolled";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { stripLocale } from "../../i18n/paths";
import { cn } from "../../utils/cn";
import Container from "../layout/Container";
import { EASE_SOFT } from "../../lib/motion/variants";

/** True if `href` targets the same route as `pathname` + `search` (locale-agnostic). */
function isActiveLink(href: string, pathname: string, search: string): boolean {
  if (!href.startsWith("/")) return false;
  const [path, query = ""] = href.split("?");
  if (path !== pathname) return false;
  if (!query) return true;
  // Active when every key/value in the link's query is present in the URL.
  const linkParams = new URLSearchParams(query);
  const currentParams = new URLSearchParams(search);
  for (const [k, v] of linkParams.entries()) {
    if (currentParams.get(k) !== v) return false;
  }
  return true;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(8);
  const location = useLocation();
  const { t } = useTranslation();
  const modal = useModal();
  const session = useSession();
  useLockBodyScroll(open);

  // The URL carries a locale prefix (e.g. /ar/browse); compare active state
  // against the language-stripped path so highlighting works in every locale.
  const activePath = stripLocale(location.pathname);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  // Close the drawer when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // Escape closes the drawer; Tab is trapped inside it so focus can't leak to
  // the page behind while `aria-modal` claims the drawer contains focus.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = drawer.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active && !drawer.contains(active)) {
        // Focus escaped the drawer (e.g. via the trigger) — pull it back in.
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus management: move focus into drawer on open, restore on close.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const id = requestAnimationFrame(() => {
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
          "a, button, [tabindex]:not([tabindex='-1'])"
        );
        firstFocusable?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    if (wasOpenRef.current) {
      triggerRef.current?.focus();
      wasOpenRef.current = false;
    }
    return undefined;
  }, [open]);

  const renderTabLink = (
    link: typeof NAV_LINKS[number],
    className: string,
    activeClassName: string
  ) => {
    const active = isActiveLink(link.href, activePath, location.search);
    return (
      <LocaleLink
        key={link.labelKey}
        to={link.href}
        className={cn(className, active && activeClassName)}
        data-active={active || undefined}
      >
        {t(link.labelKey)}
      </LocaleLink>
    );
  };

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 ease-out-soft",
        scrolled
          ? "bg-bg/85 backdrop-blur-md border-b border-white/10 shadow-card"
          : "bg-bg/95 backdrop-blur border-b border-white/5"
      )}
    >
      <Container>
        <div
          className={cn(
            "flex items-center justify-between gap-4 transition-[height] duration-300 ease-out-soft",
            scrolled ? "h-14" : "h-16"
          )}
        >
          <LocaleLink
            to="/"
            aria-label={t("a11y.sniserHome")}
            className="shrink-0 rounded-md transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Logo />
          </LocaleLink>

          {/* Desktop nav */}
          <nav aria-label={t("a11y.primaryNav")} className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) =>
              renderTabLink(
                link,
                "link-underline text-sm text-white/75 hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white",
                "text-brand-green"
              )
            )}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <LocaleNavLink
              to="/browse"
              className={({ isActive }) =>
                cn(
                  "link-underline text-sm transition-colors",
                  isActive ? "text-brand-green" : "text-white/75 hover:text-white"
                )
              }
            >
              {t("common.exploreContent")}
            </LocaleNavLink>
            <LanguageSwitcher />
            <Button
              variant="dark"
              size="sm"
              onClick={modal.openAdvertise}
              rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
            >
              {t("common.advertise")}
            </Button>
            {session.user ? (
              <>
                <WalletPill />
                <UserMenu />
              </>
            ) : (
              <>
                <Button variant="primary" size="sm" onClick={() => modal.openAuth({ mode: "signup" })}>
                  {t("common.signUp")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => modal.openAuth({ mode: "login" })}>
                  {t("common.logIn")}
                </Button>
              </>
            )}
          </div>

          {/* Mobile trigger */}
          <IconButton
            ref={triggerRef}
            label={open ? t("a11y.closeMenu") : t("a11y.openMenu")}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden"
          >
            <m.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
              animate={open ? "open" : "closed"}
            >
              <m.path
                variants={{ closed: { d: "M4 7h16" }, open: { d: "M6 6l12 12" } }}
                transition={{ duration: 0.25 }}
              />
              <m.path
                d="M4 12h16"
                variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
                transition={{ duration: 0.15 }}
              />
              <m.path
                variants={{ closed: { d: "M4 17h16" }, open: { d: "M18 6 6 18" } }}
                transition={{ duration: 0.25 }}
              />
            </m.svg>
          </IconButton>
        </div>
      </Container>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <m.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
                scrolled ? "top-14" : "top-16"
              )}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <m.div
              key="drawer"
              ref={drawerRef}
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t("a11y.navigationMenu")}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: EASE_SOFT }}
              className="lg:hidden absolute left-0 right-0 top-full z-50 border-b border-white/10 bg-bg-card/95 backdrop-blur-md shadow-card"
            >
              <Container>
                <m.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                  }}
                  className="py-5 flex flex-col gap-1"
                >
                  {NAV_LINKS.map((link) => {
                    const active = isActiveLink(link.href, activePath, location.search);
                    return (
                      <m.div
                        key={link.labelKey}
                        variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                      >
                        <LocaleLink
                          to={link.href}
                          className={cn(
                            "block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:bg-white/5",
                            active ? "text-brand-green" : "text-white/80 hover:text-white"
                          )}
                        >
                          {t(link.labelKey)}
                        </LocaleLink>
                      </m.div>
                    );
                  })}
                  <m.div variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}>
                    <LocaleNavLink
                      to="/browse"
                      className={({ isActive }) =>
                        cn(
                          "block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:bg-white/5",
                          isActive ? "text-brand-green" : "text-white/80 hover:text-white"
                        )
                      }
                    >
                      {t("common.exploreContent")}
                    </LocaleNavLink>
                  </m.div>

                  {session.user && (
                    <m.div
                      variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}
                      className="mt-3 rounded-lg bg-bg-soft/60 p-3 ring-1 ring-white/10"
                    >
                      <div className="text-sm font-semibold text-white">{session.user.name}</div>
                      <div className="text-xs text-white/55 truncate">{session.user.email}</div>
                      {session.wallet && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-semibold text-brand-green">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" aria-hidden="true" />
                          {session.wallet.balance.toFixed(2)} {session.wallet.currency}
                        </div>
                      )}
                    </m.div>
                  )}

                  {session.user && (
                    <m.div
                      variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                      className="mt-1 grid grid-cols-2 gap-1"
                    >
                      {[
                        { to: "/library", label: t("nav.library") },
                        { to: "/wallet", label: t("nav.wallet") },
                        { to: "/account", label: t("nav.account") },
                        { to: "/studio", label: session.isArtist ? t("nav.studio") : t("nav.sellYourWork") },
                      ].map((l) => (
                        <LocaleLink
                          key={l.to}
                          to={l.to}
                          className="rounded-md px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:bg-white/5"
                        >
                          {l.label}
                        </LocaleLink>
                      ))}
                    </m.div>
                  )}

                  {/* Language */}
                  <m.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    className="mt-3"
                  >
                    <div className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                      {t("language.label")}
                    </div>
                    <LanguageSwitcher variant="list" />
                  </m.div>

                  <m.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    className="mt-3 grid grid-cols-2 gap-2"
                  >
                    <Button
                      variant="dark"
                      size="sm"
                      fullWidth
                      onClick={modal.openAdvertise}
                      rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                    >
                      {t("common.advertise")}
                    </Button>
                    {session.user ? (
                      <Button variant="outline" size="sm" fullWidth onClick={session.signOut}>
                        {t("common.logOut")}
                      </Button>
                    ) : (
                      <>
                        <Button variant="primary" size="sm" fullWidth onClick={() => modal.openAuth({ mode: "signup" })}>
                          {t("common.signUp")}
                        </Button>
                        <Button variant="outline" size="sm" fullWidth className="col-span-2" onClick={() => modal.openAuth({ mode: "login" })}>
                          {t("common.logIn")}
                        </Button>
                      </>
                    )}
                  </m.div>
                </m.div>
              </Container>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
