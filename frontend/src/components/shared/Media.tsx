import { useState } from "react";
import { cn } from "../../utils/cn";

interface Props {
  src: string;
  alt: string;
  /** CSS aspect-ratio, e.g. "4 / 3", "4 / 5". */
  aspect?: string;
  className?: string;
  /** Above-the-fold: eager load + high fetch priority. */
  priority?: boolean;
  /** Slow cinematic zoom (auto-disabled under reduced motion via global CSS). */
  kenBurns?: boolean;
  /** object-position, e.g. "center", "50% 30%". */
  focus?: string;
}

/**
 * A real photograph in a framed slot: fixed aspect ratio, shimmer skeleton
 * while it loads, then a soft fade-in. Lazy + async-decoded by default,
 * eager + high-priority for above-the-fold heroes.
 */
export default function Media({
  src,
  alt,
  aspect = "4 / 3",
  className,
  priority = false,
  kenBurns = false,
  focus = "center",
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-bg-soft/60",
        className
      )}
      style={{ aspectRatio: aspect }}
    >
      {/* shimmer skeleton until the image decodes */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 shimmer-bg transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100"
        )}
      />
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // @ts-expect-error fetchPriority is valid but not yet in React's img types
        fetchpriority={priority ? "high" : undefined}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out-soft will-change-transform",
          loaded ? "opacity-100" : "opacity-0",
          kenBurns && "animate-ken-burns"
        )}
        style={{ objectPosition: focus }}
      />
      {/* legibility + depth: subtle top-to-bottom vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/45 via-transparent to-transparent"
      />
    </div>
  );
}
