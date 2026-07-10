import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useScrolled } from "../../hooks/useScrolled";

const SCROLL_THRESHOLD_PX = 600;

/**
 * Floating button that appears after the user has scrolled past the fold,
 * giving them a one-tap path back to the top on long pages.
 */
export default function BackToTop() {
  const visible = useScrolled(SCROLL_THRESHOLD_PX);
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          aria-label={t("a11y.backToTop")}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full bg-brand-green text-bg shadow-card transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-greenDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 15 6-6 6 6" />
          </svg>
        </m.button>
      )}
    </AnimatePresence>
  );
}
