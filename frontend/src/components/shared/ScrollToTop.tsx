import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Forces the window to scroll to the top whenever the route changes.
 * Honors hash navigation — `/page#anchor` still tries the anchor first.
 *
 * `behavior: "auto"` (not smooth) keeps page changes snappy and avoids the
 * jarring effect of a long smooth scroll on long pages.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
