import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import Button from "./Button";
import { EASE_SOFT } from "../../lib/motion/variants";

const STORAGE_KEY = "sniser:cookie-consent";

type Consent = "accepted" | "essential" | null;

function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "accepted" || v === "essential") return v;
  } catch {
    /* localStorage blocked — treat as no consent yet, banner shows. */
  }
  return null;
}

function writeConsent(value: Exclude<Consent, null>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore — banner will show again next visit, which is acceptable */
  }
}

/**
 * Lightweight, GDPR-style consent banner. Lives in localStorage so it stays
 * dismissed across sessions. Wire any real analytics behind `consent === "accepted"`.
 */
export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  // Read on mount only — avoids SSR / hydration mismatch concerns and keeps
  // the banner from flashing for users who already chose.
  useEffect(() => {
    setConsent(readConsent());
    setMounted(true);
  }, []);

  const choose = (value: Exclude<Consent, null>) => {
    writeConsent(value);
    setConsent(value);
  };

  const visible = mounted && consent === null;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          role="region"
          aria-label="Cookie consent"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE_SOFT }}
          className="fixed inset-x-3 bottom-3 z-[90] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md"
        >
          <div className="rounded-2xl bg-bg-card/95 backdrop-blur-md ring-1 ring-white/10 p-5 shadow-card">
            <p className="text-sm font-semibold text-white">We use cookies</p>
            <p className="mt-1.5 text-xs text-white/65 leading-relaxed text-pretty">
              Essential cookies keep Sniser working. Optional analytics help us improve. You can change this anytime.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => choose("accepted")}>
                Accept all
              </Button>
              <Button variant="dark" size="sm" onClick={() => choose("essential")}>
                Essential only
              </Button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
