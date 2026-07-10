import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Link } from "react-router-dom";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import { usePageMeta } from "../hooks/usePageMeta";
import { useModal } from "../components/shared/ModalProvider";
import { EASE_SOFT } from "../lib/motion/variants";
import { cn } from "../utils/cn";

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: "What exactly do I own when I buy access?",
    a: "You own a non-fungible access pass that lives in your wallet. As long as you hold it, you can stream the content. If you sell the pass, access transfers cleanly to the new buyer — no manual de-licensing required.",
  },
  {
    q: "Do I need to know anything about crypto?",
    a: "No. Sign in with Google or email via Crossmint, and a wallet is created for you in the background. You can move to a self-custody wallet later if you want.",
  },
  {
    q: "How does artist royalty on resale work?",
    a: "Every access pass has a built-in royalty (usually 5–10%) encoded in its smart contract. When a fan resells on the Sniser Marketplace, that royalty is paid automatically to the artist on every transaction — forever.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "Card (Visa, Mastercard, Apple Pay, Google Pay) is processed via Crossmint. If you'd rather pay in stablecoins (USDC) we support that natively at checkout.",
  },
  {
    q: "What does Sniser take?",
    a: "10% on the primary drop and 2.5% on each resale. Artists set the price and the royalty split themselves; we never touch the rest.",
  },
  {
    q: "Can I watch on my phone?",
    a: "Yes. Your access is wallet-bound, not device-bound — sign into Sniser on any browser and your library is there. We're shipping iOS and Android apps next.",
  },
  {
    q: "I'm an artist. How do I join?",
    a: "Use the 'Message us on WhatsApp' button on the artist page. Send a short pitch and 1–2 unreleased tracks. Our A&R team reviews everything within five business days.",
  },
  {
    q: "Is my content actually exclusive after release?",
    a: "Yes — all Sniser drops are platform-exclusive by contract. The content isn't published to streaming services, social feeds, or third-party stores during the exclusivity window.",
  },
];

export default function FaqPage() {
  usePageMeta({
    title: "FAQ — Sniser",
    description:
      "Answers about how Sniser works — access passes, royalties, payments, and what fans actually own.",
    canonicalPath: "/faq",
  });

  const modal = useModal();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow="Help center" align="left" className="max-w-2xl">
          Frequently asked questions
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          Everything about how Sniser works — ownership, payments, resale royalties, and getting started.
        </p>
      </Section>

      <Section tone="dark" spacing="sm">
        <ul className="mx-auto max-w-3xl divide-y divide-white/5 overflow-hidden rounded-2xl bg-bg-card ring-1 ring-white/5">
          {FAQS.map((qa, idx) => {
            const open = openIdx === idx;
            return (
              <li key={qa.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  aria-expanded={open}
                  aria-controls={`faq-${idx}`}
                  className={cn(
                    "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:bg-white/5",
                    open && "bg-white/[0.03]"
                  )}
                >
                  <span aria-hidden="true" className="mt-0.5 text-xs font-bold text-brand-green tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm sm:text-base font-semibold text-white">{qa.q}</span>
                  <m.span
                    aria-hidden="true"
                    initial={false}
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-0.5 text-white/55"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </m.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <m.div
                      id={`faq-${idx}`}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: EASE_SOFT }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 pl-12 text-sm leading-relaxed text-white/70 text-pretty">
                        {qa.a}
                      </p>
                    </m.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-brand-green/10 p-6 ring-1 ring-brand-green/25 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="text-base font-bold text-white">Still have questions?</h3>
            <p className="mt-1 text-sm text-white/65">
              Our team replies within one business day.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
            <Link to="/contact">
              <Button variant="primary" size="sm">Contact us</Button>
            </Link>
            <Button variant="dark" size="sm" onClick={() => modal.openAuth({ mode: "signup" })}>
              Create account
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
