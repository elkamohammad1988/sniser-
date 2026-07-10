import {
  ElementType,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../utils/cn";

interface Props {
  children: ReactNode;
  className?: string;
  /** Element to render as the card root. Defaults to `article`. */
  as?: ElementType;
  /** Diameter of the spotlight, e.g. `"420px"`. */
  size?: string;
  /** Render the top-lit gradient hairline. */
  bordered?: boolean;
}

/**
 * A surface that reveals a soft brand-green spotlight tracking the cursor.
 * The pointer position is written to CSS custom properties inside a
 * `requestAnimationFrame` callback, so hovering never triggers a React
 * re-render. Honors `prefers-reduced-motion` by disabling the tracking.
 */
export default function SpotlightCard({
  children,
  className,
  as,
  size = "360px",
  bordered = true,
}: Props) {
  const Root = (as ?? "article") as ElementType;
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduceMotion = useReducedMotion();

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduceMotion) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty("--spot-x", `${x}px`);
        el.style.setProperty("--spot-y", `${y}px`);
      });
    },
    [reduceMotion]
  );

  return (
    <Root
      ref={ref}
      onPointerMove={handleMove}
      className={cn(
        "group/spot relative overflow-hidden isolate",
        bordered && "gradient-border",
        className
      )}
      style={{ "--spot-size": size } as React.CSSProperties}
    >
      {!reduceMotion && (
        <span
          aria-hidden="true"
          className="spotlight pointer-events-none absolute inset-0 -z-[1] opacity-0 transition-opacity duration-500 ease-out-soft group-hover/spot:opacity-100"
        />
      )}
      {children}
    </Root>
  );
}
