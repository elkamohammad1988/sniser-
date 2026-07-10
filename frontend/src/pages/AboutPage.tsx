import { Link } from "react-router-dom";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import { StaggerContainer, StaggerItem } from "../components/shared/Stagger";
import { usePageMeta } from "../hooks/usePageMeta";

interface Member {
  name: string;
  role: string;
  initials: string;
  accent: string;
}

const TEAM: Member[] = [
  { name: "Noah Aït-Mansour", role: "Co-founder & CEO", initials: "NA", accent: "from-brand-green to-brand-greenDark" },
  { name: "Sara Bouchra", role: "Co-founder & Head of A&R", initials: "SB", accent: "from-sky-400 to-indigo-500" },
  { name: "Theo Martin", role: "CTO", initials: "TM", accent: "from-amber-400 to-rose-500" },
  { name: "Imane El Otmani", role: "Head of Partnerships", initials: "IE", accent: "from-fuchsia-400 to-violet-500" },
];

const VALUES = [
  {
    title: "Artists keep ownership",
    body: "Every release is structured so the artist holds rights, royalties, and direction. We don't take masters, ever.",
  },
  {
    title: "Fans actually own access",
    body: "Access is a transferable asset on-chain. If a fan walks away, they can sell it — and the artist still earns from that resale.",
  },
  {
    title: "Web3 should feel invisible",
    body: "Crossmint handles wallets in the background. Email login, card checkout, no seed phrases. Crypto only when it makes things better.",
  },
];

const STATS = [
  { value: "120+", label: "Artists onboarded" },
  { value: "$1.4M", label: "Paid to creators in 2025" },
  { value: "98%", label: "Holder satisfaction" },
];

export default function AboutPage() {
  usePageMeta({
    title: "About Sniser — Money for music, ownership for fans",
    description:
      "Sniser is a music platform where artists keep ownership, fans own transferable access passes, and royalties pay forever.",
    canonicalPath: "/about",
  });

  return (
    <>
      <Section tone="dark" spacing="md">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading eyebrow="About us" align="left" className="max-w-xl">
              We build the platform we wished existed for music.
            </SectionHeading>
            <p className="mt-4 max-w-xl text-sm sm:text-base text-white/65 text-pretty">
              Sniser started in 2024 between Casablanca and London with a simple question: what if fans
              actually owned what they paid for, and artists earned from every resale forever? Two years
              later we run exclusive drops with 120+ artists across hip-hop, electronic, and afrobeats.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link to="/browse">
                <Button variant="primary" size="md">Explore the catalog</Button>
              </Link>
              <Link to="/contact">
                <Button variant="dark" size="md">Talk to the team</Button>
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-2xl bg-bg-card p-6 ring-1 ring-white/5 sm:p-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="text-[10px] font-bold uppercase tracking-widestPlus text-white/45">{s.label}</dt>
                <dd className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-green">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="card" spacing="md">
        <SectionHeading eyebrow="What we believe">
          Three principles that don't move.
        </SectionHeading>
        <StaggerContainer className="mt-10 grid gap-5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <StaggerItem key={v.title}>
              <article className="h-full rounded-2xl bg-bg-soft/60 p-6 ring-1 ring-white/10 transition-transform duration-300 ease-out-soft hover:-translate-y-1 hover:ring-white/25">
                <h3 className="text-sm font-bold tracking-widestPlus uppercase text-white">{v.title}</h3>
                <p className="mt-3 text-sm text-white/65 leading-relaxed text-pretty">{v.body}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>

      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow="Team">Small team, opinionated work.</SectionHeading>
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
                <p className="mt-1 text-xs text-white/55">{m.role}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Section>
    </>
  );
}
