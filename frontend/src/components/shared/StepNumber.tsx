import { cn } from "../../utils/cn";

interface Props {
  number: number;
  /**
   * - `onDark`: dark surface → green badge with dark text
   * - `onAccent`: green or light surface → dark badge with green text
   */
  variant: "onDark" | "onAccent";
  size?: "md" | "lg";
  className?: string;
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  md: "h-10 w-10 text-base rounded-lg",
  lg: "h-12 w-12 text-lg rounded-xl",
};

export default function StepNumber({
  number,
  variant,
  size = "md",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center font-bold leading-none",
        SIZES[size],
        variant === "onAccent"
          ? "bg-bg text-brand-green"
          : "bg-brand-green text-bg",
        className
      )}
      aria-hidden="true"
    >
      {number}
    </span>
  );
}
