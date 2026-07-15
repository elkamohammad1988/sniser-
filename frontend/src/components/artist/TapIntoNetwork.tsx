import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Section from "../layout/Section";
import WhatsAppButton from "../shared/WhatsAppButton";
import AnimateIn from "../shared/AnimateIn";
import { buttonStyles } from "../shared/Button";
import { AmbientGlow, GridOverlay } from "../shared/Atmosphere";
import { ArrowRight } from "../shared/Icons";
import Media from "../shared/Media";
import { slideInLeft, slideInRight } from "../../lib/motion/variants";

export default function TapIntoNetwork() {
  const { t } = useTranslation();
  return (
    <Section
      tone="dark"
      spacing="lg"
      backdrop={
        <>
          <AmbientGlow
            color="bg-brand-green/12"
            blur="blur-[150px]"
            className="-bottom-24 left-1/2 h-72 w-[46rem] -translate-x-1/2"
          />
          <GridOverlay className="opacity-30" />
        </>
      }
    >
      <AnimateIn>
        <div className="gradient-border gradient-border-green relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-bg-card to-bg p-8 shadow-elevated ring-1 ring-white/[0.06] sm:p-12 lg:p-14">
          {/* green aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand-green/20 blur-[110px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 -bottom-16 h-56 w-56 rounded-full bg-brand-green/10 blur-[90px]"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <AnimateIn variants={slideInLeft}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widestPlus text-brand-green ring-1 ring-white/10">
                {t("artist.network.badge")}
              </span>
              <h3 className="mt-5 text-3xl font-extrabold leading-tight text-balance text-fade-white sm:text-4xl">
                {t("artist.network.heading")}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 text-pretty">
                {t("artist.network.body")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <WhatsAppButton />
                <Link
                  to="/browse"
                  className={buttonStyles("outline", "lg")}
                >
                  {t("artist.network.explore")}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </AnimateIn>

            <AnimateIn
              variants={slideInRight}
              className="group hidden lg:block"
            >
              <div className="relative mx-auto max-w-xs">
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 rounded-[2.5rem] bg-brand-green/12 opacity-70 blur-[70px] transition-opacity duration-500 group-hover:opacity-100"
                />
                <div className="gradient-border relative rounded-[1.75rem] bg-white/[0.03] p-3 ring-1 ring-white/10 shadow-card transition-transform duration-500 ease-out-soft group-hover:-translate-y-1.5">
                  <Media
                    src="/media/cta-network.jpg"
                    alt={t("artist.network.imageAlt")}
                    aspect="5 / 4"
                    focus="center"
                    className="rounded-[1.4rem]"
                  />
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </AnimateIn>
    </Section>
  );
}
