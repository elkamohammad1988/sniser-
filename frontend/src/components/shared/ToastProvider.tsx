import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { EASE_SOFT } from "../../lib/motion/variants";
import { cn } from "../../utils/cn";

export type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastContextValue {
  show: (tone: ToastTone, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L20 6" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8v5m0 3.5v.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v.01M11 12h1v5h1" />
    </svg>
  ),
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: "bg-bg-card ring-1 ring-brand-green/40 text-white",
  error: "bg-bg-card ring-1 ring-red-500/40 text-white",
  info: "bg-bg-card ring-1 ring-white/15 text-white",
};

const ICON_TONE: Record<ToastTone, string> = {
  success: "text-brand-green",
  error: "text-red-400",
  info: "text-white/70",
};

/**
 * Global toast queue. Provider mounts the visual stack in the top-right; any
 * component calls `useToast().success("Done")` to enqueue. Toasts auto-dismiss
 * after 4 seconds. Keyboard-dismissible via the close button.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue["show"]>((tone, title, message) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((prev) => [...prev, { id, tone, title, message }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, message) => show("success", title, message),
      error: (title, message) => show("error", title, message),
      info: (title, message) => show("info", title, message),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed right-3 top-20 sm:right-4 sm:top-4 z-[110] flex w-[min(92vw,22rem)] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <m.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: EASE_SOFT }}
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-card",
                TONE_CLASS[t.tone]
              )}
            >
              <span className={cn("mt-0.5 shrink-0", ICON_TONE[t.tone])}>{ICONS[t.tone]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-white/65 text-pretty">{t.message}</p>}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
