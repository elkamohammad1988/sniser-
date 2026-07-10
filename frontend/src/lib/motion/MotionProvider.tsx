import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Bundle-size optimization for Framer Motion:
 *   - `LazyMotion + domAnimation` ships ~21 kB instead of the full ~50 kB.
 *   - `strict` enforces that components use `m.X` (not `motion.X`) so the
 *     async features bundle is actually leveraged.
 *   - `MotionConfig reducedMotion="user"` honors OS-level reduced-motion
 *     preference for *every* motion component automatically.
 */
export default function MotionProvider({ children }: Props) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
