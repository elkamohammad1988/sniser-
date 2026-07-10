import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../utils/cn";

interface Props {
  src: string;
  /** Still shown before/while the video loads, and the reduced-motion fallback. */
  poster: string;
  /** Accessible description of the footage. */
  label: string;
  aspect?: string;
  className?: string;
  /** Show the pulsing “LIVE” chip. */
  badge?: string;
}

/**
 * A muted, looping, autoplaying background video in a framed slot. Only starts
 * once it scrolls near the viewport (saves bandwidth), fades in over its poster,
 * and — under `prefers-reduced-motion` — renders the poster image alone.
 */
export default function VideoFrame({
  src,
  poster,
  label,
  aspect = "4 / 3",
  className,
  badge = "Live",
}: Props) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false); // near viewport → mount <source>
  const [ready, setReady] = useState(false); // first frame painted → fade in

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (active) videoRef.current?.play().catch(() => {});
  }, [active]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-bg-ink",
        className
      )}
      style={{ aspectRatio: aspect }}
    >
      {/* poster underlay — always present, hidden once video paints */}
      <img
        src={poster}
        alt={reduceMotion ? label : ""}
        aria-hidden={reduceMotion ? undefined : true}
        loading="lazy"
        decoding="async"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          ready ? "opacity-0" : "opacity-100"
        )}
      />

      {!reduceMotion && active && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={poster}
          aria-label={label}
          onPlaying={() => setReady(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-700 ease-out-soft",
            ready ? "opacity-100" : "opacity-0"
          )}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {/* cinematic vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-bg/10"
      />

      {/* live chip */}
      {badge && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-bg/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widestPlus text-white backdrop-blur-sm ring-1 ring-white/15">
          <span className="relative flex h-1.5 w-1.5">
            {!reduceMotion && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-80" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-green" />
          </span>
          {badge}
        </span>
      )}
    </div>
  );
}
