import { AnchorHTMLAttributes, forwardRef } from "react";
import { isExternalUrl, isPlaceholderHref, isUnsafeHref } from "../../utils/url";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Marks the link as inert without removing it from the tab order. The link
   * still receives focus and renders, but click does nothing — useful for CTAs
   * that aren't wired up yet.
   */
  inert?: boolean;
}

/**
 * `<a>` with two behaviors automated:
 *   - placeholder hrefs ("#" or empty) call `e.preventDefault()` and set
 *     `aria-disabled` so assistive tech announces them as disabled
 *   - absolute http(s) URLs get `target="_blank"` + a safe `rel`
 * Everything else stays a plain anchor — drop in anywhere an `<a>` would go.
 */
const SafeLink = forwardRef<HTMLAnchorElement, Props>(
  ({ href, target, rel, inert, onClick, children, ...rest }, ref) => {
    // A dangerous scheme (javascript:, data:, …) is never rendered as a live
    // target: drop the href entirely and treat it like an inert placeholder.
    const unsafe = isUnsafeHref(href);
    const safeHref = unsafe ? undefined : href;
    const placeholder = isPlaceholderHref(href) || unsafe;
    const external = isExternalUrl(safeHref);
    const finalTarget = target ?? (external ? "_blank" : undefined);
    const finalRel = rel ?? (finalTarget === "_blank" ? "noopener noreferrer" : undefined);

    return (
      <a
        ref={ref}
        href={safeHref}
        target={finalTarget}
        rel={finalRel}
        aria-disabled={inert || placeholder ? true : undefined}
        tabIndex={inert ? -1 : undefined}
        onClick={(e) => {
          if (inert || placeholder) e.preventDefault();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }
);

SafeLink.displayName = "SafeLink";
export default SafeLink;
