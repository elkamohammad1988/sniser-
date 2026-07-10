import { ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { cn } from "../../utils/cn";
import { EASE_SOFT } from "../../lib/motion/variants";

interface Props {
  /** Render-prop for the trigger; receives the toggle handler. */
  trigger: (toggle: () => void, isOpen: boolean) => ReactNode;
  /** Items rendered inside the panel. */
  children: ReactNode;
  /** Accessible label for the menu. */
  label: string;
  /** Visual alignment of the panel relative to the trigger. */
  align?: "left" | "right";
  /** Tailwind width — defaults to `w-56`. */
  widthClass?: string;
}

/**
 * Tiny accessible dropdown menu. Closes on outside click, Escape, and route
 * change (route close is consumer's responsibility — use `key={pathname}` on
 * the parent if needed). Keyboard support: Enter/Space opens via the trigger,
 * Tab cycles inside; Escape closes and restores focus to the trigger.
 */
export default function Dropdown({ trigger, children, label, align = "right", widthClass = "w-56" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Capture the trigger element via a ref callback so we can return focus to
  // it after the menu closes.
  const triggerSlotRef = (el: HTMLDivElement | null) => {
    if (el) {
      const focusable = el.querySelector<HTMLElement>("button, a, [tabindex]:not([tabindex='-1'])");
      triggerRef.current = focusable;
    }
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <div ref={triggerSlotRef}>{trigger(() => setOpen((v) => !v), open)}</div>
      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE_SOFT }}
            className={cn(
              "absolute z-50 mt-2 rounded-xl bg-bg-card ring-1 ring-white/10 shadow-card p-1.5 overflow-hidden",
              widthClass,
              align === "right" ? "right-0" : "left-0"
            )}
            onClick={(e) => {
              // Auto-close when an item inside is activated (button/a click).
              const target = e.target as HTMLElement;
              if (target.closest("[data-menu-item]")) setOpen(false);
            }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ItemProps {
  onSelect?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  tone?: "default" | "danger";
}

/** Standard menu item used inside <Dropdown>. */
export function DropdownItem({ onSelect, icon, children, tone = "default" }: ItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      data-menu-item
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors focus:outline-none focus-visible:bg-white/10",
        tone === "danger"
          ? "text-red-300 hover:bg-red-500/10 hover:text-red-200"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon && <span className="grid h-4 w-4 place-items-center shrink-0 text-current/70">{icon}</span>}
      <span className="flex-1 min-w-0 truncate">{children}</span>
    </button>
  );
}

/** Non-interactive header row shown at the top of a menu (e.g. user info). */
export function DropdownHeader({ children }: { children: ReactNode }) {
  return <div className="px-3 py-2 text-xs text-white/55">{children}</div>;
}

/** Thin divider between item groups. */
export function DropdownDivider() {
  return <div className="my-1 h-px bg-white/10" aria-hidden="true" />;
}
