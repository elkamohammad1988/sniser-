import { ComponentType, SVGProps } from "react";
import Section from "../layout/Section";
import SafeLink from "../shared/SafeLink";
import { SOCIAL_LINKS } from "../shared/socialLinks";
import {
  VisaLogo,
  MastercardLogo,
  ApplePayLogo,
  GooglePayLogo,
} from "../shared/PaymentLogos";
import { StaggerContainer, StaggerItem } from "../shared/Stagger";

type Logo = ComponentType<SVGProps<SVGSVGElement>>;

const PAYMENTS: { label: string; Logo: Logo; width: string }[] = [
  { label: "VISA", Logo: VisaLogo, width: "w-12" },
  { label: "Mastercard", Logo: MastercardLogo, width: "w-10" },
  { label: "Apple Pay", Logo: ApplePayLogo, width: "w-14" },
  { label: "Google Pay", Logo: GooglePayLogo, width: "w-16" },
];

const SOCIAL_BADGE =
  "grid h-8 w-8 place-items-center rounded-md bg-white/5 text-white/80 hover:text-brand-green hover:bg-white/10 transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card aria-disabled:opacity-60 aria-disabled:cursor-not-allowed";

export default function PaymentMethods() {
  return (
    <Section tone="card" spacing="sm">
      <StaggerContainer className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-4">
        <StaggerItem>
          <p className="text-sm text-white/60">
            Powered by <span className="font-semibold text-white">Crossmint</span>
          </p>
        </StaggerItem>

        <StaggerItem>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="text-xs text-white/40 uppercase tracking-widestPlus">
              Pay With
            </span>
            <ul className="flex flex-wrap items-center gap-3" aria-label="Accepted payment methods">
              {PAYMENTS.map(({ label, Logo, width }) => (
                <li
                  key={label}
                  className="grid h-8 place-items-center rounded-md bg-white/5 px-3 ring-1 ring-white/10 text-white/85 hover:bg-white/10 hover:ring-white/20 transition-all duration-200 ease-out-soft hover:-translate-y-0.5"
                  title={label}
                >
                  <Logo className={`${width} h-5`} aria-label={label} />
                </li>
              ))}
            </ul>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-white/40 uppercase tracking-widestPlus">
              Follow
            </span>
            <ul className="flex items-center gap-2.5" aria-label="Social links">
              {SOCIAL_LINKS.map(({ label, Icon, href }) => (
                <li key={label}>
                  <SafeLink href={href} aria-label={label} className={SOCIAL_BADGE}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </SafeLink>
                </li>
              ))}
            </ul>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </Section>
  );
}
