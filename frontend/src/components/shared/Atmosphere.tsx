import { CSSProperties } from "react";
import { cn } from "../../utils/cn";

/**
 * Ambient atmosphere primitives shared across premium sections. Each one is
 * decorative, `aria-hidden`, and never intercepts pointer events — they only
 * add depth (light, grain, structure) behind real content.
 */

interface GrainProps {
  className?: string;
  /** 0–1 blend strength. Kept low so it reads as texture, not noise. */
  opacity?: number;
}

/** Soft film grain over the parent surface. Parent must be `relative`. */
export function GrainOverlay({ className, opacity = 0.14 }: GrainProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 texture-grain mix-blend-soft-light",
        className
      )}
      style={{ opacity }}
    />
  );
}

interface GridProps {
  className?: string;
  /** Use ink-toned lines for light/green surfaces instead of white. */
  tone?: "light" | "ink";
}

/** Blueprint grid that dissolves toward the edges via a radial mask. */
export function GridOverlay({ className, tone = "light" }: GridProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 mask-radial-fade",
        tone === "ink" ? "texture-grid-ink" : "texture-grid",
        className
      )}
    />
  );
}

interface GlowProps {
  className?: string;
  style?: CSSProperties;
  /** Tailwind color utility for the blob, e.g. `bg-brand-green/25`. */
  color?: string;
  /** Blur amount utility. */
  blur?: string;
  /** Gentle breathing animation. */
  animated?: boolean;
}

/**
 * A single blurred radial light source. Position it with `className`
 * (e.g. `-top-24 left-1/3 h-72 w-72`).
 */
export function AmbientGlow({
  className,
  style,
  color = "bg-brand-green/25",
  blur = "blur-[90px]",
  animated = false,
}: GlowProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full",
        color,
        blur,
        animated && "animate-glow-pulse",
        className
      )}
      style={style}
    />
  );
}
