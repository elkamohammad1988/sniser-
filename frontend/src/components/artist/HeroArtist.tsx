import { m, useTransform } from "framer-motion";
import WhatsAppButton from "../shared/WhatsAppButton";
import Container from "../layout/Container";
import CountUp from "../shared/CountUp";
import Media from "../shared/Media";
import { GrainOverlay, GridOverlay, AmbientGlow } from "../shared/Atmosphere";
import { EASE_SOFT } from "../../lib/motion/variants";
import { usePointerParallax } from "../../hooks/usePointerParallax";

const STATS = [
  { value: 120, suffix: "+", label: "Artists onboarded" },
  { value: 1.4, decimals: 1, prefix: "$", suffix: "M", label: "Paid to creators" },
  { value: 98, suffix: "%", label: "Holder satisfaction" },
];

// Lighting overlay that turns the flat green fill into a dimensional surface.
const MESH =
  "radial-gradient(58% 60% at 12% 6%, rgba(214,255,150,0.9), transparent 60%)," +
  "radial-gradient(56% 66% at 100% 102%, rgba(120,174,42,0.62), transparent 56%)," +
  "radial-gradient(42% 42% at 80% 32%, rgba(255,255,255,0.34), transparent 62%)";

export default function HeroArtist() {
  const { x, y, bind } = usePointerParallax();
  const illoX = useTransform(x, (v) => v * 26);
  const illoY = useTransform(y, (v) => v * 26);
  const orbAX = useTransform(x, (v) => v * -52);
  const orbAY = useTransform(y, (v) => v * -52);
  const orbBX = useTransform(x, (v) => v * 44);
  const orbBY = useTransform(y, (v) => v * 44);

  return (
    <section
      {...bind}
      className="relative isolate overflow-hidden bg-brand-green text-bg"
    >
      {/* Atmosphere ------------------------------------------------------- */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: MESH }} />
      <GridOverlay tone="ink" className="opacity-70" />
      <AmbientGlow
        color="bg-white/30"
        blur="blur-[110px]"
        className="-top-24 left-[8%] h-72 w-72"
        animated
      />
      <AmbientGlow
        color="bg-brand-greenDark/50"
        blur="blur-[120px]"
        className="-bottom-28 right-[6%] h-80 w-80"
      />
      <GrainOverlay opacity={0.1} />

      <Container className="relative z-10">
        <div className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-28">
          {/* Left: message + proof ---------------------------------------- */}
          <m.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_SOFT }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-bg px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widestPlus text-brand-green shadow-[0_6px_20px_-8px_rgba(15,17,21,0.6)] ring-1 ring-bg/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-green" />
              </span>
              For Artists
            </span>

            <h1 className="mt-6 text-hero font-extrabold text-balance text-fade-ink">
              Money For
              <br />
              Your Music
            </h1>

            <p className="mt-6 max-w-md text-pretty text-sm leading-relaxed text-bg/80 sm:text-base">
              You bring the talent — we bring the booking. Sniser invests real
              capital into your sound so you can stay in the booth and out of the
              red. You keep creating. We handle the business. We grow together.
            </p>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: EASE_SOFT }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
            >
              <WhatsAppButton />
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2.5 text-sm font-semibold text-bg/75 transition-colors hover:text-bg focus-visible:outline-none focus-visible:text-bg"
              >
                See how it works
                <span className="grid h-7 w-7 place-items-center rounded-full bg-bg/10 ring-1 ring-bg/15 transition-transform duration-300 ease-out-soft group-hover:translate-y-0.5">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M6 13l6 6 6-6" />
                  </svg>
                </span>
              </a>
            </m.div>
          </m.div>

          {/* Right: framed illustration ----------------------------------- */}
          <m.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.12, ease: EASE_SOFT }}
            style={{ x: illoX, y: illoY }}
            className="relative mx-auto w-full max-w-md"
          >
            {/* soft bloom lifting the figure off the green */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -m-6 rounded-[3rem] bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.6),transparent_62%)] blur-2xl"
            />

            <div className="relative gradient-border animate-float rounded-[2rem] bg-white/12 p-3 shadow-frame backdrop-blur-[2px] sm:p-4">
              <Media
                src="/media/hero-artist.jpg"
                alt="Recording artist performing on stage under studio lights"
                aspect="4 / 5"
                priority
                kenBurns
                focus="50% 32%"
                className="rounded-[1.5rem]"
              />
            </div>

            {/* floating accents */}
            <m.div
              style={{ x: orbAX, y: orbAY }}
              className="absolute -right-4 -top-5 hidden sm:block"
            >
              <div className="h-11 w-11 rotate-45 rounded-xl bg-bg shadow-elevated animate-float-slow" />
            </m.div>
            <m.div
              style={{ x: orbBX, y: orbBY }}
              className="absolute -left-5 bottom-10 hidden sm:block"
            >
              <div className="h-7 w-7 rounded-full bg-brand-greenDark shadow-lg ring-4 ring-white/40 animate-float" />
            </m.div>
            <div
              aria-hidden="true"
              className="absolute -bottom-3 right-10 h-3 w-3 rounded-full bg-bg/80"
            />
          </m.div>
        </div>

        {/* Trust strip — full-width band across the base of the hero */}
        <m.dl
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE_SOFT }}
          className="mt-4 grid grid-cols-2 gap-y-6 border-t border-bg/15 pt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-x-12 lg:mt-8"
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-12">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="hidden h-10 w-px bg-bg/15 sm:block"
                />
              )}
              <div>
                <dd className="text-[1.75rem] font-extrabold tracking-tight text-bg sm:text-3xl">
                  <CountUp
                    value={stat.value}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </dd>
                <dt className="mt-1 text-[11px] font-semibold uppercase tracking-widestPlus text-bg/55">
                  {stat.label}
                </dt>
              </div>
            </div>
          ))}
        </m.dl>
      </Container>
    </section>
  );
}
