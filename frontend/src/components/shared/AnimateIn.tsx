import { m, type Variants } from "framer-motion";
import { ReactNode } from "react";
import { fadeUp } from "../../lib/motion/variants";

type Tag = "div" | "section" | "article" | "header" | "footer";

interface Props {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
  /** Trigger animation once it enters viewport. Defaults to true. */
  once?: boolean;
  /** Viewport margin string (CSS-like). */
  margin?: string;
  /** Render as a different HTML element. */
  as?: Tag;
}

/**
 * Scroll-triggered entrance wrapper. Honors `prefers-reduced-motion` via the
 * MotionConfig provider in `main.tsx`, so no explicit guard is needed here.
 */
export default function AnimateIn({
  children,
  variants = fadeUp,
  delay = 0,
  className,
  once = true,
  margin = "0px 0px -80px 0px",
  as = "div",
}: Props) {
  const MotionTag = m[as] as typeof m.div;
  return (
    <MotionTag
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: margin as never }}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
