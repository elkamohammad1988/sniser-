import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Section from "../layout/Section";
import SectionHeading from "../shared/SectionHeading";
import AnimateIn from "../shared/AnimateIn";
import { AmbientGlow, GridOverlay } from "../shared/Atmosphere";
import HowItWorksSection from "./HowItWorksSection";
import Media from "../shared/Media";
import VideoFrame from "../shared/VideoFrame";
import type { SectionVariant } from "../../types";

interface Item {
  number: number;
  highlight: string;
  title: string;
  description: string;
  media: ReactNode;
  variant: SectionVariant;
  imageLeft: boolean;
}

export default function HowItWorksList() {
  const { t } = useTranslation();

  const ITEMS: Item[] = [
    {
      number: 1,
      highlight: t("artist.process.items.contact.highlight"),
      title: t("artist.process.items.contact.title"),
      description: t("artist.process.items.contact.description"),
      media: (
        <Media
          src="/media/step-contact.jpg"
          alt={t("artist.process.items.contact.imageAlt")}
          aspect="4 / 3"
        />
      ),
      variant: "dark",
      imageLeft: true,
    },
    {
      number: 2,
      highlight: t("artist.process.items.agreement.highlight"),
      title: t("artist.process.items.agreement.title"),
      description: t("artist.process.items.agreement.description"),
      media: (
        <Media
          src="/media/step-agreement.jpg"
          alt={t("artist.process.items.agreement.imageAlt")}
          aspect="4 / 3"
        />
      ),
      variant: "green",
      imageLeft: false,
    },
    {
      number: 3,
      highlight: t("artist.process.items.studio.highlight"),
      title: t("artist.process.items.studio.title"),
      description: t("artist.process.items.studio.description"),
      media: (
        <Media
          src="/media/step-studio.jpg"
          alt={t("artist.process.items.studio.imageAlt")}
          aspect="4 / 3"
        />
      ),
      variant: "light",
      imageLeft: true,
    },
    {
      number: 4,
      highlight: t("artist.process.items.release.highlight"),
      title: t("artist.process.items.release.title"),
      description: t("artist.process.items.release.description"),
      media: (
        <VideoFrame
          src="/media/live-crowd.mp4"
          poster="/media/step-release.jpg"
          label={t("artist.process.items.release.videoLabel")}
          aspect="4 / 3"
          badge={t("artist.process.items.release.badge")}
        />
      ),
      variant: "dark",
      imageLeft: false,
    },
    {
      number: 5,
      highlight: t("artist.process.items.revenue.highlight"),
      title: t("artist.process.items.revenue.title"),
      description: t("artist.process.items.revenue.description"),
      media: (
        <Media
          src="/media/step-revenue.jpg"
          alt={t("artist.process.items.revenue.imageAlt")}
          aspect="4 / 3"
        />
      ),
      variant: "green",
      imageLeft: true,
    },
  ];

  return (
    <>
      <Section
        id="how-it-works"
        tone="dark"
        spacing="md"
        backdrop={
          <>
            <AmbientGlow
              color="bg-brand-green/10"
              blur="blur-[130px]"
              className="-top-16 left-1/2 h-64 w-[40rem] -translate-x-1/2"
            />
            <GridOverlay className="opacity-40" />
          </>
        }
      >
        <SectionHeading eyebrow={t("artist.process.eyebrow")}>
          {t("artist.process.heading")}
        </SectionHeading>
        <AnimateIn delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-white/55 sm:text-base text-pretty">
            {t("artist.process.intro")}
          </p>
        </AnimateIn>
      </Section>

      {ITEMS.map((item) => (
        <HowItWorksSection key={item.number} {...item} />
      ))}
    </>
  );
}
