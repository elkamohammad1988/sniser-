import { useCallback } from "react";
import {
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

interface Parallax {
  /** Normalized cursor offset from center, roughly -0.5…0.5, spring-smoothed. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Spread onto the element that should track the pointer. */
  bind: {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
  };
}

/**
 * Tracks the pointer's position within an element as a spring-smoothed,
 * center-relative offset. Consumers multiply the values to move layers at
 * different depths. No-ops under `prefers-reduced-motion`.
 */
export function usePointerParallax(stiffness = 120, damping = 20): Parallax {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness, damping, mass: 0.4 });
  const y = useSpring(rawY, { stiffness, damping, mass: 0.4 });

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduceMotion || e.pointerType === "touch") return;
      const rect = e.currentTarget.getBoundingClientRect();
      rawX.set((e.clientX - rect.left) / rect.width - 0.5);
      rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [rawX, rawY, reduceMotion]
  );

  const onPointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { x, y, bind: { onPointerMove, onPointerLeave } };
}
