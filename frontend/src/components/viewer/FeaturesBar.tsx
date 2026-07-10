import { ReactNode } from "react";
import Section from "../layout/Section";
import { ShieldIcon, LockIcon, SwapIcon, UsersIcon } from "../shared/Icons";
import { StaggerContainer, StaggerItem } from "../shared/Stagger";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    title: "True Ownership",
    description: "You own the access. You own the rights.",
  },
  {
    icon: <LockIcon className="h-5 w-5" />,
    title: "Easy & Secure",
    description: "Powered by Crossmint. Simple to set up, secure by design.",
  },
  {
    icon: <SwapIcon className="h-5 w-5" />,
    title: "Transferable",
    description: "Sell or transfer access on the Sniser Marketplace.",
  },
  {
    icon: <UsersIcon className="h-5 w-5" />,
    title: "Support Creators",
    description:
      "Artists earn royalties on every single resale. You get paid, artist earns.",
  },
];

export default function FeaturesBar() {
  return (
    <Section tone="green" spacing="sm">
      <StaggerContainer className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <StaggerItem key={f.title}>
            <div className="flex items-start gap-4 group">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-bg text-brand-green transition-transform duration-300 ease-out-soft group-hover:-translate-y-0.5 group-hover:scale-105">
                {f.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-bg">{f.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-bg/75 text-pretty">
                  {f.description}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </Section>
  );
}
