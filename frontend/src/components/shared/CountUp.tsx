import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../utils/cn";

interface Props {
  /** Final numeric value to animate to. */
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Animation length in ms. */
  duration?: number;
  className?: string;
}

/** easeOutExpo — a fast start that settles gently, ideal for counters. */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * A number that counts up from zero the first time it scrolls into view.
 * Falls back to the final value instantly under `prefers-reduced-motion`.
 * Uses a live-region-free `aria-label` so screen readers announce the target
 * once rather than every intermediate frame.
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1600,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let start = 0;
    let done = false;

    const tick = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(value * easeOutExpo(progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done) {
          done = true;
          raf = requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, reduceMotion]);

  const formatted = `${prefix}${display.toFixed(decimals)}${suffix}`;
  const target = `${prefix}${value.toFixed(decimals)}${suffix}`;

  return (
    <span ref={ref} className={cn("tabular-nums", className)} aria-label={target}>
      <span aria-hidden="true">{formatted}</span>
    </span>
  );
}
