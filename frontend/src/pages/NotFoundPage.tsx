import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Section from "../components/layout/Section";
import Button from "../components/shared/Button";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFoundPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("notFound.meta.title"),
    description: t("notFound.meta.description"),
  });

  return (
    <Section tone="dark" spacing="lg">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-widestPlus text-brand-green">
          {t("notFound.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white text-balance">
          {t("notFound.heading")}
        </h1>
        <p className="mt-4 text-sm sm:text-base text-white/65 text-pretty">
          {t("notFound.body")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link to="/">
            <Button variant="primary" size="md">{t("notFound.goHome")}</Button>
          </Link>
          <Link to="/browse">
            <Button variant="dark" size="md">{t("common.browseCatalog")}</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="md">{t("notFound.contactSupport")}</Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
