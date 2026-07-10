import { cn } from "../../utils/cn";

type Size = "xs" | "sm" | "md" | "lg";

interface Props {
  size?: Size;
  className?: string;
  label?: string;
}

const SIZES: Record<Size, string> = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-2",
};

export default function Spinner({ size = "sm", className, label = "Loading" }: Props) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        SIZES[size],
        className
      )}
    />
  );
}
