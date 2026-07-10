import { m } from "framer-motion";
import Section from "../layout/Section";
import { StaggerContainer, StaggerItem } from "../shared/Stagger";
import { AmbientGlow } from "../shared/Atmosphere";
import { EASE_SOFT } from "../../lib/motion/variants";
import {
  SendIcon,
  DocumentIcon,
  HeadphoneIcon,
  WaveformIcon,
  ChartIcon,
} from "../shared/Icons";

const STEPS = [
  { number: 1, label: "Contact Sniser", icon: <SendIcon className="h-6 w-6" /> },
  {
    number: 2,
    label: "Exclusive Content Agreement",
    icon: <DocumentIcon className="h-6 w-6" />,
  },
  {
    number: 3,
    label: "Studio Production & Mixing",
    icon: <HeadphoneIcon className="h-6 w-6" />,
  },
  {
    number: 4,
    label: "Exclusive Platform Release",
    icon: <WaveformIcon className="h-6 w-6" />,
  },
  {
    number: 5,
    label: "Revenue Generation & Profit Share",
    icon: <ChartIcon className="h-6 w-6" />,
  },
];

export default function StepsOverview() {
  return (
    <Section
      tone="card"
      spacing="sm"
      className="border-y border-white/5"
      backdrop={
        <AmbientGlow
          color="bg-brand-green/8"
          blur="blur-[120px]"
          className="left-1/2 top-1/2 h-56 w-[44rem] -translate-x-1/2 -translate-y-1/2"
        />
      }
    >
      {/* Mobile: 2-column grid of nodes, no rail. */}
      <StaggerContainer className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:hidden">
        {STEPS.map((step) => (
          <StaggerItem key={step.number}>
            <StepNode {...step} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Desktop: a single self-drawing rail threading the five nodes. */}
      <div className="relative hidden lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-x-[10%] top-7 -translate-y-1/2"
        >
          <span className="absolute inset-0 h-px bg-white/10" />
          <m.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 1.2, ease: EASE_SOFT }}
            className="absolute inset-0 h-px origin-left bg-gradient-to-r from-brand-green/0 via-brand-green to-brand-green/0"
          />
        </div>

        <StaggerContainer className="relative flex justify-between gap-2">
          {STEPS.map((step) => (
            <StaggerItem key={step.number} className="flex-1">
              <StepNode {...step} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </Section>
  );
}

function StepNode({
  number,
  label,
  icon,
}: {
  number: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="gradient-border relative grid h-14 w-14 place-items-center rounded-2xl bg-bg text-brand-green shadow-card ring-1 ring-white/10 transition-all duration-300 ease-out-soft group-hover:-translate-y-1 group-hover:shadow-glow group-hover:ring-brand-green/40">
        {icon}
        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-green text-[10px] font-bold text-bg ring-2 ring-bg-card">
          {number}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-widestPlus text-white/45">
        Step {number}
      </p>
      <p className="mt-1 max-w-[11rem] text-sm font-semibold leading-snug text-white/85 text-pretty">
        {label}
      </p>
    </div>
  );
}
