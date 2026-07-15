import { ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { EASE_SOFT } from "../../lib/motion/variants";
import IconButton from "./IconButton";
import { cn } from "../../utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional title — also serves as the modal's accessible name. */
  title?: string;
  /** Optional subhead under the title. */
  description?: string;
  /** Visual sizing. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Hide the close button (rare — keep enabled for usability). */
  hideClose?: boolean;
  /**
   * Wrap children in the default padded panel body with the title/description
   * header. Set `false` for edge-to-edge content (e.g. a media player) that
   * manages its own layout; the panel then clips children to its rounded corners.
   */
  padded?: boolean;
  children: ReactNode;
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-4xl",
};

/**
 * Accessible modal dialog:
 *   - locks body scroll while open
 *   - traps focus inside the panel
 *   - returns focus to the previously focused element on close
 *   - closes on Escape and backdrop click
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  hideClose,
  padded = true,
  children,
}: Props) {
  useLockBodyScroll(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Restore focus to the element that opened the modal.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      const id = requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLElement>(
          "a, button, input, textarea, select, [tabindex]:not([tabindex='-1'])"
        );
        first?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    previouslyFocused.current?.focus?.();
    return undefined;
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap — keep Tab inside the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        "a, button, input, textarea, select, [tabindex]:not([tabindex='-1'])"
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const titleId = title ? "modal-title" : undefined;
  const descId = description ? "modal-desc" : undefined;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="modal-root"
          className="fixed inset-0 z-[100] grid place-items-center px-4 py-6 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: EASE_SOFT }}
            className={cn(
              "relative w-full rounded-2xl bg-bg-card text-white ring-1 ring-white/10 shadow-card",
              !padded && "overflow-hidden",
              SIZES[size]
            )}
          >
            {!hideClose && (
              <IconButton
                label="Close"
                onClick={onClose}
                className="absolute right-3 top-3 h-9 w-9 bg-transparent border-0 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </IconButton>
            )}

            {padded ? (
              <div className="p-6 sm:p-7">
                {title && (
                  <h2 id={titleId} className="text-xl font-extrabold tracking-tight text-white pr-8">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="mt-1.5 text-sm text-white/60 text-pretty pr-8">
                    {description}
                  </p>
                )}
                <div className={cn(title || description ? "mt-5" : undefined)}>
                  {children}
                </div>
              </div>
            ) : (
              children
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
