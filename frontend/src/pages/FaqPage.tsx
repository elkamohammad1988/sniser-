import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  qKey: string;
  aKey: string;
}

const FAQS: QA[] = [
  { qKey: "faq.items.own.q", aKey: "faq.items.own.a" },
  { qKey: "faq.items.crypto.q", aKey: "faq.items.crypto.a" },
  { qKey: "faq.items.royalty.q", aKey: "faq.items.royalty.a" },
  { qKey: "faq.items.payments.q", aKey: "faq.items.payments.a" },
  { qKey: "faq.items.fee.q", aKey: "faq.items.fee.a" },
  { qKey: "faq.items.mobile.q", aKey: "faq.items.mobile.a" },
  { qKey: "faq.items.artist.q", aKey: "faq.items.artist.a" },
  { qKey: "faq.items.exclusive.q", aKey: "faq.items.exclusive.a" },
];

export default function FaqPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("faq.meta.title"),
    description: t("faq.meta.description"),
    canonicalPath: "/faq",
  });

  const modal = useModal();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow={t("faq.hero.eyebrow")} align="left" className="max-w-2xl">
          {t("faq.hero.heading")}
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          {t("faq.hero.body")}
        </p>
      </Section>

      <Section tone="dark" spacing="sm">
        <ul className="mx-auto max-w-3xl divide-y divide-white/5 overflow-hidden rounded-2xl bg-bg-card ring-1 ring-white/5">
          {FAQS.map((qa, idx) => {
            const open = openIdx === idx;
            return (
              <li key={qa.qKey}>
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
                  <span className="flex-1 text-sm sm:text-base font-semibold text-white">{t(qa.qKey)}</span>
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
                        {t(qa.aKey)}
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
            <h3 className="text-base font-bold text-white">{t("faq.cta.heading")}</h3>
            <p className="mt-1 text-sm text-white/65">
              {t("faq.cta.body")}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
            <Link to="/contact">
              <Button variant="primary" size="sm">{t("faq.cta.contact")}</Button>
            </Link>
            <Button variant="dark" size="sm" onClick={() => modal.openAuth({ mode: "signup" })}>
              {t("faq.cta.createAccount")}
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
