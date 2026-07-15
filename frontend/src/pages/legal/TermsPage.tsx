import { useTranslation, Trans } from "react-i18next";
import LegalPage from "./LegalPage";
import { usePageMeta } from "../../hooks/usePageMeta";
import { COMPANY_LEGAL_NAME, SUPPORT_EMAIL } from "../../utils/constants";

export default function TermsPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("legal.terms.meta.title"),
    description: t("legal.terms.meta.description"),
    canonicalPath: "/terms",
  });

  return (
    <LegalPage
      eyebrow={t("legal.shell.eyebrow")}
      title={t("legal.terms.title")}
      effective="May 17, 2026"
      summary={t("legal.terms.summary", { company: COMPANY_LEGAL_NAME })}
    >
      <section>
        <h2>{t("legal.terms.sections.agreement.title")}</h2>
        <p>{t("legal.terms.sections.agreement.body")}</p>
      </section>

      <section>
        <h2>{t("legal.terms.sections.accounts.title")}</h2>
        <p>{t("legal.terms.sections.accounts.body")}</p>
      </section>

      <section>
        <h2>{t("legal.terms.sections.passes.title")}</h2>
        <p>{t("legal.terms.sections.passes.body")}</p>
        <ul>
          <li>{t("legal.terms.sections.passes.items.notInvestments")}</li>
          <li>{t("legal.terms.sections.passes.items.royalties")}</li>
          <li>{t("legal.terms.sections.passes.items.noCustody")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("legal.terms.sections.payments.title")}</h2>
        <p>{t("legal.terms.sections.payments.body")}</p>
      </section>

      <section>
        <h2>{t("legal.terms.sections.artistAgreements.title")}</h2>
        <p>{t("legal.terms.sections.artistAgreements.body")}</p>
      </section>

      <section>
        <h2>{t("legal.terms.sections.prohibited.title")}</h2>
        <ul>
          <li>{t("legal.terms.sections.prohibited.items.circumvent")}</li>
          <li>{t("legal.terms.sections.prohibited.items.reselling")}</li>
          <li>{t("legal.terms.sections.prohibited.items.scraping")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("legal.terms.sections.disclaimer.title")}</h2>
        <p>{t("legal.terms.sections.disclaimer.body")}</p>
      </section>

      <section>
        <h2>{t("legal.terms.sections.changes.title")}</h2>
        <p>{t("legal.terms.sections.changes.body")}</p>
      </section>

      <section>
        <h2>{t("legal.terms.sections.contact.title")}</h2>
        <p>
          <Trans
            i18nKey="legal.terms.sections.contact.body"
            values={{ email: SUPPORT_EMAIL }}
            components={{ mail: <a href={`mailto:${SUPPORT_EMAIL}`} /> }}
          />
        </p>
      </section>
    </LegalPage>
  );
}
