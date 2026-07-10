import { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { ArrowRight } from "./Icons";

export interface FlowStep {
  label: string;
  icon: ReactNode;
}

interface Props {
  steps: FlowStep[];
  /** Render with badges suited to a dark surface (default) or onto an accent (green/light) panel. */
  variant?: "onDark" | "onAccent";
  className?: string;
}

/**
 * Horizontal step-flow with circular icon badges connected by chevrons.
 * Stays in a single row across breakpoints — sizes scale down on narrow
 * screens so 4–5 steps fit comfortably without horizontal scroll.
 */
export default function FlowSteps({ steps, variant = "onDark", className }: Props) {
  const onAccent = variant === "onAccent";

  const badge = onAccent
    ? "bg-bg text-brand-green ring-1 ring-bg/20"
    : "bg-brand-green text-bg ring-1 ring-brand-green/30";
  const label = onAccent ? "text-bg/85" : "text-white/85";
  const arrow = onAccent ? "text-bg/55" : "text-white/35";

  return (
    <ol
      className={cn(
        "flex items-start justify-between sm:justify-start gap-1 sm:gap-3",
        className
      )}
      aria-label="Process flow"
    >
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.label} className="flex items-center gap-1 sm:gap-3">
            <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2 group">
              <span
                className={cn(
                  "grid h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 place-items-center rounded-full shadow-card transition-transform duration-300 ease-out-soft group-hover:-translate-y-0.5 group-hover:scale-105",
                  badge
                )}
                aria-hidden="true"
              >
                {step.icon}
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] lg:text-xs font-semibold leading-tight max-w-[4.5rem] sm:max-w-[6rem] text-pretty",
                  label
                )}
              >
                {step.label}
              </span>
            </div>

            {!last && (
              <ArrowRight
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 shrink-0 -mt-2 sm:-mt-3",
                  arrow
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
