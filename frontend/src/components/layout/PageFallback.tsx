import Container from "./Container";

/**
 * Generic skeleton shown while a lazy-loaded page chunk is being fetched.
 * Kept route-agnostic so it works on every destination (dark surfaces, the
 * green hero, etc.) without flashing the wrong palette during navigation.
 */
export default function PageFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="bg-bg"
    >
      <Container>
        <div className="py-16 lg:py-24">
          <div className="space-y-4 max-w-2xl">
            <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse-soft" />
            <div className="h-10 w-3/4 rounded-xl bg-white/10 animate-pulse-soft" />
            <div className="h-10 w-2/3 rounded-xl bg-white/10 animate-pulse-soft" />
            <div className="pt-3 space-y-2.5">
              <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse-soft" />
              <div className="h-4 w-5/6 rounded bg-white/[0.06] animate-pulse-soft" />
              <div className="h-4 w-2/3 rounded bg-white/[0.06] animate-pulse-soft" />
            </div>
            <div className="pt-3 flex gap-2">
              <div className="h-10 w-32 rounded-lg bg-white/[0.06] animate-pulse-soft" />
              <div className="h-10 w-28 rounded-lg bg-white/[0.06] animate-pulse-soft" />
            </div>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-bg-card/60 ring-1 ring-white/5 p-5 animate-pulse-soft"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="aspect-[4/3] rounded-xl bg-white/5" />
                <div className="mt-4 h-3 w-1/3 rounded bg-white/10" />
                <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
                <div className="mt-1.5 h-3 w-1/2 rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </Container>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
