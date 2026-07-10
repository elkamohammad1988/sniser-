import { Link } from "react-router-dom";
import Section from "../components/layout/Section";
import Button from "../components/shared/Button";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFoundPage() {
  usePageMeta({
    title: "Not found — Sniser",
    description: "The page you were looking for doesn't exist or has moved.",
  });

  return (
    <Section tone="dark" spacing="lg">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-widestPlus text-brand-green">
          Error 404
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white text-balance">
          That page slipped through the wallet.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-white/65 text-pretty">
          The link may be old, or the drop you're looking for may have moved.
          Head back home, browse the catalog, or get in touch.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link to="/">
            <Button variant="primary" size="md">Go home</Button>
          </Link>
          <Link to="/browse">
            <Button variant="dark" size="md">Browse catalog</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="md">Contact support</Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
