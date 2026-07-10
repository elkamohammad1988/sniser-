import { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "../../utils/cn";
import Spinner from "./Spinner";
import SafeLink from "./SafeLink";

export type ButtonVariant = "primary" | "outline" | "ghost" | "dark" | "light";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-green text-bg border border-brand-green hover:bg-brand-greenDark active:scale-[0.98]",
  outline:
    "bg-transparent text-white border border-white/25 hover:bg-white/10 hover:border-white/40",
  ghost: "bg-transparent text-white hover:bg-white/10",
  dark: "bg-bg-card text-white border border-white/10 hover:bg-bg-soft hover:border-white/20",
  light: "bg-bg text-white hover:bg-bg-ink active:scale-[0.98]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

/**
 * Shared style string for buttons and button-styled anchors. Keeps `<button>`
 * and `<a>` rendered consistently without duplicating Tailwind classes.
 */
export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth?: boolean,
  className?: string
): string {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out-soft",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      fullWidth,
      isLoading,
      loadingText,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={buttonStyles(variant, size, fullWidth, className)}
        {...rest}
      >
        {isLoading ? (
          <>
            <Spinner size={size === "lg" ? "md" : "sm"} />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  /** Marks the link as inert without removing it from the tab order — used for
   * placeholder/unconfigured CTAs so they read as disabled to assistive tech. */
  inert?: boolean;
}

/**
 * Anchor styled exactly like `<Button>`. Use when a CTA navigates somewhere
 * (external URL, SPA route, mailto, etc.) instead of triggering an action.
 * Delegates href/target/placeholder handling to `<SafeLink>`.
 */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      ...rest
    },
    ref
  ) => (
    <SafeLink
      ref={ref}
      className={buttonStyles(variant, size, fullWidth, className)}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </SafeLink>
  )
);

LinkButton.displayName = "LinkButton";
