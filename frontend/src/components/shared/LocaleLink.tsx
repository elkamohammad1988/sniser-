import { forwardRef } from "react";
import { Link, LinkProps, NavLink, NavLinkProps } from "react-router-dom";
import { useLocale } from "../../i18n/useLocale";

/**
 * `<Link>` that automatically prefixes internal targets with the active locale
 * (English stays unprefixed). External URLs, mailto:, and `#anchors` pass
 * through untouched. Use this everywhere instead of the bare react-router Link
 * so navigation never drops the language.
 */
export const LocaleLink = forwardRef<HTMLAnchorElement, LinkProps>(function LocaleLink(
  { to, ...rest },
  ref
) {
  const { localize } = useLocale();
  const target = typeof to === "string" ? localize(to) : to;
  return <Link ref={ref} to={target} {...rest} />;
});

/** Locale-aware variant of react-router's `<NavLink>` (keeps active styling). */
export const LocaleNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function LocaleNavLink(
  { to, ...rest },
  ref
) {
  const { localize } = useLocale();
  const target = typeof to === "string" ? localize(to) : to;
  return <NavLink ref={ref} to={target} {...rest} />;
});
