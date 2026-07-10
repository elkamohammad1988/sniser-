import { ReactNode } from "react";
import { cn } from "../../utils/cn";
import type { SectionVariant } from "../../types";
import { CheckIcon } from "../shared/Icons";
import AnimateIn from "../shared/AnimateIn";
import StepNumber from "../shared/StepNumber";
import FlowSteps, { type FlowStep } from "../shared/FlowSteps";
import { slideInLeft, slideInRight } from "../../lib/motion/variants";

interface Props {
  number: number;
  title: string;
  highlight?: string;
  description: string;
  /** Visual content (illustration or other media) shown on the media side. */
  media: ReactNode;
  variant: SectionVariant;
  imageLeft?: boolean;
  bullets?: string[];
  pills?: { label: string; icon?: ReactNode }[];
  callout?: string;
  /** Horizontal step-flow rendered below the description (e.g. resell flow). */
  flow?: FlowStep[];
  /** Optional card slot rendered alongside the media (e.g. "Secure" badge). */
  sideCard?: ReactNode;
}

const SURFACE: Record<SectionVariant, string> = {
  dark: "bg-bg-card ring-1 ring-white/5 hover:ring-white/10",
  green: "bg-brand-green",
  light: "bg-white",
};

export default function ViewerStep({
  number,
  title,
  highlight,
  description,
  media,
  variant,
  imageLeft = false,
  bullets,
  pills,
  callout,
  flow,
  sideCard,
}: Props) {
  const isGreen = variant === "green";
  const onAccent = isGreen || variant === "light";

  const titleClasses = onAccent ? "text-bg" : "text-white";
  const bodyClasses = onAccent ? "text-bg/75" : "text-white/65";
  const highlightClasses = isGreen ? "text-bg" : "text-brand-green";

  return (
    <AnimateIn
      className={cn(
        "rounded-3xl p-7 sm:p-10 transition-all duration-300 ease-out-soft hover:shadow-card",
        SURFACE[variant]
      )}
    >
      <div
        className={cn(
          "grid items-center gap-8 lg:grid-cols-2 lg:gap-12",
          imageLeft ? "" : "lg:[&>*:first-child]:order-2"
        )}
      >
        <AnimateIn
          variants={imageLeft ? slideInLeft : slideInRight}
          className="group"
        >
          {sideCard ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-6 justify-center">
              <div className="w-full sm:max-w-[60%]">{media}</div>
              <div className="w-full sm:max-w-[40%] sm:self-center">{sideCard}</div>
            </div>
          ) : (
            <div className="mx-auto max-w-md">{media}</div>
          )}
        </AnimateIn>

        <AnimateIn variants={imageLeft ? slideInRight : slideInLeft} delay={0.1}>
          <StepNumber number={number} variant={onAccent ? "onAccent" : "onDark"} />

          <h3
            className={cn(
              "mt-4 text-2xl sm:text-3xl lg:text-[2rem] font-extrabold leading-tight uppercase tracking-tight text-balance",
              titleClasses
            )}
          >
            <span className="sr-only">Step {number}: </span>
            {highlight ? (
              <>
                <span className={highlightClasses}>{highlight}</span>{" "}
              </>
            ) : null}
            {title}
          </h3>

          <p
            className={cn(
              "mt-4 text-sm sm:text-base leading-relaxed text-pretty",
              bodyClasses
            )}
          >
            {description}
          </p>

          {bullets && (
            <ul className="mt-5 space-y-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    onAccent ? "text-bg/80" : "text-white/80"
                  )}
                >
                  <CheckIcon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      onAccent ? "text-bg" : "text-brand-green"
                    )}
                    aria-hidden="true"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {pills && (
            <div className="mt-5 flex flex-wrap gap-2">
              {pills.map((p) => (
                <span
                  key={p.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform duration-200 ease-out-soft hover:-translate-y-0.5",
                    onAccent
                      ? "bg-bg text-white"
                      : "bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15"
                  )}
                >
                  {p.icon}
                  {p.label}
                </span>
              ))}
            </div>
          )}

          {flow && (
            <div className="mt-6">
              <FlowSteps
                steps={flow}
                variant={onAccent ? "onAccent" : "onDark"}
              />
            </div>
          )}

          {callout && (
            <div
              className={cn(
                "mt-5 flex items-start gap-2 rounded-lg p-3 text-xs",
                onAccent
                  ? "bg-bg/10 text-bg/80"
                  : "bg-brand-green/10 text-white/80 ring-1 ring-brand-green/20"
              )}
            >
              <CheckIcon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  onAccent ? "text-bg" : "text-brand-green"
                )}
                aria-hidden="true"
              />
              <span>{callout}</span>
            </div>
          )}
        </AnimateIn>
      </div>
    </AnimateIn>
  );
}
