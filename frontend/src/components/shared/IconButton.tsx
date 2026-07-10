import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required for screen readers — icon-only buttons need a name. */
  label: string;
  children: ReactNode;
}

const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ label, className, children, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid h-10 w-10 place-items-center rounded-lg transition-colors duration-150",
        "bg-transparent text-white border border-white/15 hover:bg-white/10 hover:border-white/30",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);

IconButton.displayName = "IconButton";
export default IconButton;
