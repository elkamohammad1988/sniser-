import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Section from "../../components/layout/Section";
import SectionHeading from "../../components/shared/SectionHeading";
import Button from "../../components/shared/Button";

interface Props {
  eyebrow: string;
  title: string;
  effective: string;
  /** Optional summary shown in a card right under the heading. */
  summary?: string;
  children: ReactNode;
}

/**
 * Shared shell for legal pages (terms, privacy). Keeps typography and
 * spacing identical across documents so they read as a coherent set.
 */
export default function LegalPage({ eyebrow, title, effective, summary, children }: Props) {
  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow={eyebrow} align="left" className="max-w-3xl">
          {title}
        </SectionHeading>
        <p className="mt-3 text-xs text-white/40">
          Effective {effective}
        </p>
        {summary && (
          <p className="mt-6 max-w-3xl rounded-2xl bg-bg-card p-5 text-sm text-white/70 ring-1 ring-white/5 text-pretty">
            {summary}
          </p>
        )}
      </Section>

      <Section tone="dark" spacing="sm">
        <article className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-white/70 [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-white [&_h2]:mb-3 [&_p]:text-pretty [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-brand-green [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-brand-greenDark">
          {children}
        </article>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-bg-card p-6 ring-1 ring-white/5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="text-base font-bold text-white">Need a different document?</h3>
            <p className="mt-1 text-sm text-white/65">
              For licensing, NDA, or data-processing agreements, reach out to legal.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:shrink-0">
            <Link to="/contact">
              <Button variant="primary" size="sm">Contact legal</Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
