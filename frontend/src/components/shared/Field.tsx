import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useId,
} from "react";
import { cn } from "../../utils/cn";

interface BaseProps {
  label: string;
  hint?: string;
  error?: string | null;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

const baseInputClass =
  "block w-full rounded-lg bg-bg-soft/60 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-all duration-150 focus:border-brand-green/60 focus:ring-2 focus:ring-brand-green/30 disabled:opacity-60 disabled:cursor-not-allowed";

const errorClass = "border-red-500/60 focus:border-red-500 focus:ring-red-500/30";

function describedBy(errorId?: string, hintId?: string) {
  return [errorId, hintId].filter(Boolean).join(" ") || undefined;
}

export const TextField = forwardRef<
  HTMLInputElement,
  BaseProps & InputHTMLAttributes<HTMLInputElement>
>(({ label, hint, error, leftIcon, fullWidth = true, className, id, ...rest }, ref) => {
  const autoId = useId();
  const inputId = id ?? `f-${autoId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  // The hint <p> is only rendered when there is no error, so only advertise it
  // via aria-describedby then — otherwise it points at a non-existent element.
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  return (
    <div className={cn(fullWidth && "w-full", className)}>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-white/75">
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(errorId, hintId)}
          className={cn(baseInputClass, !!leftIcon && "pl-10", !!error && errorClass)}
          {...rest}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-white/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
TextField.displayName = "TextField";

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ label, hint, error, fullWidth = true, className, id, rows = 4, ...rest }, ref) => {
  const autoId = useId();
  const inputId = id ?? `f-${autoId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  // The hint <p> is only rendered when there is no error, so only advertise it
  // via aria-describedby then — otherwise it points at a non-existent element.
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  return (
    <div className={cn(fullWidth && "w-full", className)}>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-white/75">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(errorId, hintId)}
        className={cn(baseInputClass, "resize-y min-h-[5rem]", error && errorClass)}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-white/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
TextArea.displayName = "TextArea";
