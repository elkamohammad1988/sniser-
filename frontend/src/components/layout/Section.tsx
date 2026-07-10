import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import Container from "./Container";

export type SectionTone = "dark" | "card" | "green" | "light";
export type SectionSpacing = "none" | "sm" | "md" | "lg";

interface Props extends Omit<HTMLAttributes<HTMLElement>, "id"> {
  id?: string;
  tone?: SectionTone;
  spacing?: SectionSpacing;
  children: ReactNode;
  /**
   * Optional full-bleed decorative layer rendered behind the container
   * (ambient glows, grain, grid). When provided, the section becomes a
   * clipped stacking context and the content is lifted above it.
   */
  backdrop?: ReactNode;
  /** Extra classes for the inner container. */
  containerClassName?: string;
}

const TONES: Record<SectionTone, string> = {
  dark: "bg-bg text-white",
  card: "bg-bg-card text-white",
  green: "bg-brand-green text-bg",
  light: "bg-bg-light text-bg",
};

const SPACING: Record<SectionSpacing, string> = {
  none: "",
  sm: "py-10 sm:py-12 lg:py-14",
  md: "py-14 sm:py-16 lg:py-20",
  lg: "py-16 sm:py-20 lg:py-24",
};

/** Consistent vertical rhythm + brand tone for every page section. */
export default function Section({
  id,
  tone = "dark",
  spacing = "md",
  className,
  children,
  backdrop,
  containerClassName,
  ...rest
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        TONES[tone],
        SPACING[spacing],
        Boolean(backdrop) && "relative isolate overflow-hidden",
        className
      )}
      {...rest}
    >
      {backdrop && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {backdrop}
        </div>
      )}
      <Container className={cn(Boolean(backdrop) && "relative z-10", containerClassName)}>
        {children}
      </Container>
    </section>
  );
}
