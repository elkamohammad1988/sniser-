import { ReactNode } from "react";
import { cn } from "../../utils/cn";
import type { SectionVariant } from "../../types";
import Section from "../layout/Section";
import AnimateIn from "../shared/AnimateIn";
import StepNumber from "../shared/StepNumber";
import { slideInLeft, slideInRight } from "../../lib/motion/variants";

interface Props {
  number: number;
  title: string;
  highlight?: string;
  description: string;
  /** Visual content rendered on the media side (illustration component). */
  media: ReactNode;
  variant: SectionVariant;
  imageLeft?: boolean;
}

const TONE_MAP: Record<SectionVariant, "card" | "green" | "light"> = {
  dark: "card",
  green: "green",
  light: "light",
};

// Per-tone treatment for the illustration showcase frame + the glow behind it.
const FRAME: Record<SectionVariant, string> = {
  dark: "gradient-border bg-white/[0.03] ring-1 ring-white/10 shadow-card",
  green: "gradient-border bg-bg/[0.05] ring-1 ring-bg/12 shadow-frame",
  light:
    "bg-white ring-1 ring-black/[0.06] shadow-[0_26px_60px_-30px_rgba(15,17,21,0.32)]",
};

const GLOW: Record<SectionVariant, string> = {
  dark: "bg-brand-green/12",
  green: "bg-white/45",
  light: "bg-brand-green/25",
};

const TOTAL = 5;

export default function HowItWorksSection({
  number,
  title,
  highlight,
  description,
  media,
  variant,
  imageLeft = false,
}: Props) {
  const isGreen = variant === "green";
  const onAccent = isGreen || variant === "light";

  const titleClasses = onAccent ? "text-bg" : "text-white";
  const bodyClasses = onAccent ? "text-bg/75" : "text-white/65";
  const kickerClasses = onAccent ? "text-bg/50" : "text-white/40";
  const highlightClasses = isGreen
    ? "text-bg underline decoration-bg/40 underline-offset-4"
    : "text-brand-green";

  return (
    <Section tone={TONE_MAP[variant]} spacing="md">
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-14",
          imageLeft ? "" : "lg:[&>*:first-child]:order-1"
        )}
      >
        <AnimateIn
          variants={imageLeft ? slideInLeft : slideInRight}
          className="group order-2 lg:order-none"
        >
          <div className="relative mx-auto max-w-md">
            <div
              aria-hidden="true"
              className={cn(
                "absolute -inset-6 rounded-[2.75rem] opacity-70 blur-[80px] transition-opacity duration-500 group-hover:opacity-100",
                GLOW[variant]
              )}
            />
            <div
              className={cn(
                "relative rounded-[1.75rem] p-4 transition-all duration-500 ease-out-soft group-hover:-translate-y-1.5 sm:p-6",
                FRAME[variant]
              )}
            >
              <div className="transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]">
                {media}
              </div>
            </div>
          </div>
        </AnimateIn>

        <AnimateIn
          variants={imageLeft ? slideInRight : slideInLeft}
          delay={0.1}
          className="order-1 lg:order-none"
        >
          <div className="flex items-center gap-3">
            <StepNumber number={number} variant={onAccent ? "onAccent" : "onDark"} />
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-widestPlus tabular-nums",
                kickerClasses
              )}
            >
              Step {number} / 0{TOTAL}
            </span>
          </div>

          <h3
            className={cn(
              "mt-5 text-2xl font-extrabold leading-tight tracking-tight text-balance sm:text-3xl lg:text-[2rem]",
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
              "mt-4 max-w-xl text-sm leading-relaxed text-pretty sm:text-base",
              bodyClasses
            )}
          >
            {description}
          </p>
        </AnimateIn>
      </div>
    </Section>
  );
}
