import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, m } from "framer-motion";
import { EASE_SOFT } from "../../lib/motion/variants";
import { cn } from "../../utils/cn";
import { CheckLineIcon, AlertCircleIcon, InfoIcon, CloseIcon } from "./Icons";

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
  success: <CheckLineIcon className="h-5 w-5" strokeWidth={2.5} />,
  error: <AlertCircleIcon className="h-5 w-5" strokeWidth={2.5} />,
  info: <InfoIcon className="h-5 w-5" strokeWidth={2.5} />,
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
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
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
        aria-label={t("toastRegion.notifications")}
        className="pointer-events-none fixed right-3 top-20 sm:right-4 sm:top-4 z-[110] flex w-[min(92vw,22rem)] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <m.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: EASE_SOFT }}
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-card",
                TONE_CLASS[item.tone]
              )}
            >
              <span className={cn("mt-0.5 shrink-0", ICON_TONE[item.tone])}>{ICONS[item.tone]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.message && <p className="mt-0.5 text-xs text-white/65 text-pretty">{item.message}</p>}
              </div>
              <button
                type="button"
                aria-label={t("toastRegion.dismiss")}
                onClick={() => dismiss(item.id)}
                className="shrink-0 rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                <CloseIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
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
