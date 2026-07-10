import { ReactNode } from "react";
import Section from "../layout/Section";
import SectionHeading from "../shared/SectionHeading";
import SpotlightCard from "../shared/SpotlightCard";
import { AmbientGlow, GridOverlay } from "../shared/Atmosphere";
import { ShieldIcon, SparkIcon, SupportIcon } from "../shared/Icons";
import { StaggerContainer, StaggerItem } from "../shared/Stagger";
import { cn } from "../../utils/cn";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  highlighted?: boolean;
}

function IconTile({
  children,
  highlighted,
}: {
  children: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "gradient-border relative mb-6 grid h-12 w-12 place-items-center rounded-xl transition-all duration-300 ease-out-soft",
        highlighted
          ? "bg-bg/15 text-bg"
          : "bg-white/[0.04] text-brand-green group-hover/spot:bg-brand-green/10 group-hover/spot:shadow-glow"
      )}
    >
      {children}
    </div>
  );
}

function FeatureCard({ icon, title, description, highlighted }: FeatureCardProps) {
  const body = (
    <div className="relative z-10">
      <IconTile highlighted={highlighted}>{icon}</IconTile>
      <h3
        className={cn(
          "mb-2 text-sm font-bold uppercase tracking-widestPlus",
          highlighted ? "text-bg" : "text-white"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed text-pretty",
          highlighted ? "text-bg/80" : "text-white/60"
        )}
      >
        {description}
      </p>
    </div>
  );

  if (highlighted) {
    return (
      <article className="group relative isolate h-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-greenSoft via-brand-green to-brand-greenDark p-6 text-bg shadow-[0_22px_55px_-22px_rgba(166,232,77,0.6)] transition-all duration-300 ease-out-soft gradient-border hover:-translate-y-1.5 hover:shadow-glowLg sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_0%,rgba(255,255,255,0.4),transparent_58%)]"
        />
        {body}
      </article>
    );
  }

  return (
    <SpotlightCard className="h-full rounded-2xl bg-bg-card p-6 ring-1 ring-white/5 transition-all duration-300 ease-out-soft hover:-translate-y-1.5 hover:ring-white/12 hover:shadow-card sm:p-7">
      {body}
    </SpotlightCard>
  );
}

const CARDS: FeatureCardProps[] = [
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    title: "No Upfront Costs",
    description:
      "We invest in you. We cover the financial side so you don't have to stress about the budget.",
  },
  {
    icon: <SparkIcon className="h-5 w-5" />,
    title: "Exclusive Opportunities",
    description:
      "Connect with your peers. We provide a platform built specifically to elevate your career.",
    highlighted: true,
  },
  {
    icon: <SupportIcon className="h-5 w-5" />,
    title: "Full-Service Support",
    description:
      "From studio to sale. We are with you at every stage of the creative and release process.",
  },
];

export default function CreateRecordRelease() {
  return (
    <Section
      tone="dark"
      spacing="md"
      backdrop={
        <>
          <AmbientGlow
            color="bg-brand-green/12"
            blur="blur-[130px]"
            className="-top-24 left-1/2 h-72 w-[38rem] -translate-x-1/2"
          />
          <GridOverlay className="opacity-40" />
        </>
      }
    >
      <SectionHeading eyebrow="Only With Sniser" highlight="Earn">
        Create. Record. Release.
      </SectionHeading>

      <StaggerContainer className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <StaggerItem key={card.title}>
            <FeatureCard {...card} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </Section>
  );
}
