import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import { StaggerContainer, StaggerItem } from "../components/shared/Stagger";
import { usePageMeta } from "../hooks/usePageMeta";

interface Member {
  name: string;
  roleKey: string;
  initials: string;
  accent: string;
}

const TEAM: Member[] = [
  { name: "Noah Aït-Mansour", roleKey: "about.team.roles.ceo", initials: "NA", accent: "from-brand-green to-brand-greenDark" },
  { name: "Sara Bouchra", roleKey: "about.team.roles.ar", initials: "SB", accent: "from-sky-400 to-indigo-500" },
  { name: "Theo Martin", roleKey: "about.team.roles.cto", initials: "TM", accent: "from-amber-400 to-rose-500" },
  { name: "Imane El Otmani", roleKey: "about.team.roles.partnerships", initials: "IE", accent: "from-fuchsia-400 to-violet-500" },
];

const VALUES = [
  { titleKey: "about.values.ownership.title", bodyKey: "about.values.ownership.body" },
  { titleKey: "about.values.access.title", bodyKey: "about.values.access.body" },
  { titleKey: "about.values.web3.title", bodyKey: "about.values.web3.body" },
];

const STATS = [
  { value: "120+", labelKey: "about.stats.onboarded" },
  { value: "$1.4M", labelKey: "about.stats.paid" },
  { value: "98%", labelKey: "about.stats.satisfaction" },
];

export default function AboutPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("about.meta.title"),
    description: t("about.meta.description"),
    canonicalPath: "/about",
  });

  return (
    <>
      <Section tone="dark" spacing="md">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading eyebrow={t("about.hero.eyebrow")} align="left" className="max-w-xl">
              {t("about.hero.heading")}
            </SectionHeading>
            <p className="mt-4 max-w-xl text-sm sm:text-base text-white/65 text-pretty">
              {t("about.hero.body")}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link to="/browse">
                <Button variant="primary" size="md">{t("about.hero.exploreCatalog")}</Button>
              </Link>
              <Link to="/contact">
                <Button variant="dark" size="md">{t("about.hero.talkToTeam")}</Button>
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-2xl bg-bg-card p-6 ring-1 ring-white/5 sm:p-8">
            {STATS.map((s) => (
              <div key={s.labelKey} className="text-center">
                <dt className="text-[10px] font-bold uppercase tracking-widestPlus text-white/45">{t(s.labelKey)}</dt>
                <dd className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-green">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="card" spacing="md">
        <SectionHeading eyebrow={t("about.values.eyebrow")}>
          {t("about.values.heading")}
        </SectionHeading>
        <StaggerContainer className="mt-10 grid gap-5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <StaggerItem key={v.titleKey}>
              <article className="h-full rounded-2xl bg-bg-soft/60 p-6 ring-1 ring-white/10 transition-transform duration-300 ease-out-soft hover:-translate-y-1 hover:ring-white/25">
                <h3 className="text-sm font-bold tracking-widestPlus uppercase text-white">{t(v.titleKey)}</h3>
                <p className="mt-3 text-sm text-white/65 leading-relaxed text-pretty">{t(v.bodyKey)}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow={t("about.team.eyebrow")}>{t("about.team.heading")}</SectionHeading>
        <StaggerContainer className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <StaggerItem key={m.name}>
              <article className="flex h-full flex-col items-center rounded-2xl bg-bg-card p-6 text-center ring-1 ring-white/5 transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:ring-white/15">
                <span
                  aria-hidden="true"
                  className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${m.accent} text-bg text-lg font-extrabold`}
                >
                  {m.initials}
                </span>
                <h3 className="mt-4 text-sm font-bold text-white">{m.name}</h3>
                <p className="mt-1 text-xs text-white/55">{t(m.roleKey)}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>
    </>
  );
}
