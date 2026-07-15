import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Section from "../layout/Section";
import { ShieldIcon, LockIcon, SwapIcon, UsersIcon } from "../shared/Icons";
import { StaggerContainer, StaggerItem } from "../shared/Stagger";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function FeaturesBar() {
  const { t } = useTranslation();
  const FEATURES: Feature[] = [
    {
      icon: <ShieldIcon className="h-5 w-5" />,
      title: t("viewer.features.ownership.title"),
      description: t("viewer.features.ownership.description"),
    },
    {
      icon: <LockIcon className="h-5 w-5" />,
      title: t("viewer.features.secure.title"),
      description: t("viewer.features.secure.description"),
    },
    {
      icon: <SwapIcon className="h-5 w-5" />,
      title: t("viewer.features.transferable.title"),
      description: t("viewer.features.transferable.description"),
    },
    {
      icon: <UsersIcon className="h-5 w-5" />,
      title: t("viewer.features.creators.title"),
      description: t("viewer.features.creators.description"),
    },
  ];
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
