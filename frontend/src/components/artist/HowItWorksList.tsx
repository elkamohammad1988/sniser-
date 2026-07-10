import { ReactNode } from "react";
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

const ITEMS: Item[] = [
  {
    number: 1,
    highlight: "CONTACT",
    title: "SNISER",
    description:
      "It starts with a pitch. Send us your details, your unreleased cuts, a breakdown of your style, and your aspirations. We don't sign everyone — our team reviews your catalog to gauge your raw potential and figure out exactly how your sound fits the Sniser audience.",
    media: (
      <Media
        src="/media/step-contact.jpg"
        alt="Sniser A&R team celebrating a new artist signing"
        aspect="4 / 3"
      />
    ),
    variant: "dark",
    imageLeft: true,
  },
  {
    number: 2,
    highlight: "EXCLUSIVE",
    title: "CONTENT AGREEMENT",
    description:
      "If we love the music, we lock in the deal. Hop on Zoom and draft a straightforward agreement: we work together to build, record, and drop exclusive music meant strictly for release on the Sniser platform.",
    media: (
      <Media
        src="/media/step-agreement.jpg"
        alt="Two people shaking hands to close an exclusive deal"
        aspect="4 / 3"
      />
    ),
    variant: "green",
    imageLeft: false,
  },
  {
    number: 3,
    highlight: "STUDIO",
    title: "PRODUCTION & MIXING",
    description:
      "Time to hit the lab. We plug you into our network of partner recording studios. You get a professional tracking environment and work with top-tier engineers to make sure the record hits as hard as it should. The best part? Sniser covers the production costs.",
    media: (
      <Media
        src="/media/step-studio.jpg"
        alt="Studio microphone glowing under warm session lights"
        aspect="4 / 3"
      />
    ),
    variant: "light",
    imageLeft: true,
  },
  {
    number: 4,
    highlight: "EXCLUSIVE",
    title: "PLATFORM RELEASE",
    description:
      "The drop. Your album goes live exclusively on the Sniser platform. While the music lives securely on our site, our marketing team goes to work — blasting promotional teasers across TikTok, Instagram, and YouTube to drive every bit of mainstream traffic directly to your release.",
    media: (
      <VideoFrame
        src="/media/live-crowd.mp4"
        poster="/media/step-release.jpg"
        label="Crowd with hands raised at a live show under stage lasers"
        aspect="4 / 3"
        badge="Live"
      />
    ),
    variant: "dark",
    imageLeft: false,
  },
  {
    number: 5,
    highlight: "REVENUE",
    title: "GENERATION & PROFIT SHARE",
    description:
      "Attention turns into capital. Fans purchase direct access to your exclusive content right on Sniser. The revenue is split between you and the platform based on the exact percentages laid out in your deal. You get paid for your art.",
    media: (
      <Media
        src="/media/step-revenue.jpg"
        alt="Analytics dashboard showing audience and revenue growth"
        aspect="4 / 3"
      />
    ),
    variant: "green",
    imageLeft: true,
  },
];

export default function HowItWorksList() {
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
        <SectionHeading eyebrow="The Process">How It Works</SectionHeading>
        <AnimateIn delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-white/55 sm:text-base text-pretty">
            From first pitch to profit share — five deliberate steps, each one
            fully handled by the Sniser team so you can stay focused on the music.
          </p>
        </AnimateIn>
      </Section>

      {ITEMS.map((item) => (
        <HowItWorksSection key={item.number} {...item} />
      ))}
    </>
  );
}
