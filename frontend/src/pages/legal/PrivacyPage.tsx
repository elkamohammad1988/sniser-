import { useTranslation, Trans } from "react-i18next";
import LegalPage from "./LegalPage";
import { usePageMeta } from "../../hooks/usePageMeta";
import { COMPANY_LEGAL_NAME, SUPPORT_EMAIL } from "../../utils/constants";

export default function PrivacyPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("legal.privacy.meta.title"),
    description: t("legal.privacy.meta.description"),
    canonicalPath: "/privacy",
  });

  return (
    <LegalPage
      eyebrow={t("legal.shell.eyebrow")}
      title={t("legal.privacy.title")}
      effective="May 17, 2026"
      summary={t("legal.privacy.summary", { company: COMPANY_LEGAL_NAME })}
    >
      <section>
        <h2>{t("legal.privacy.sections.collect.title")}</h2>
        <ul>
          <li>{t("legal.privacy.sections.collect.items.account")}</li>
          <li>{t("legal.privacy.sections.collect.items.wallet")}</li>
          <li>{t("legal.privacy.sections.collect.items.payment")}</li>
          <li>{t("legal.privacy.sections.collect.items.usage")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.use.title")}</h2>
        <p>{t("legal.privacy.sections.use.body")}</p>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.cookies.title")}</h2>
        <p>{t("legal.privacy.sections.cookies.body")}</p>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.sharing.title")}</h2>
        <ul>
          <li>{t("legal.privacy.sections.sharing.items.processor")}</li>
          <li>{t("legal.privacy.sections.sharing.items.cloud")}</li>
          <li>{t("legal.privacy.sections.sharing.items.law")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.rights.title")}</h2>
        <p>
          <Trans
            i18nKey="legal.privacy.sections.rights.body"
            values={{ email: SUPPORT_EMAIL }}
            components={{ mail: <a href={`mailto:${SUPPORT_EMAIL}`} /> }}
          />
        </p>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.retention.title")}</h2>
        <p>{t("legal.privacy.sections.retention.body")}</p>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.security.title")}</h2>
        <p>{t("legal.privacy.sections.security.body")}</p>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.changes.title")}</h2>
        <p>{t("legal.privacy.sections.changes.body")}</p>
      </section>

      <section>
        <h2>{t("legal.privacy.sections.contact.title")}</h2>
        <p>
          <Trans
            i18nKey="legal.privacy.sections.contact.body"
            values={{ email: SUPPORT_EMAIL }}
            components={{ mail: <a href={`mailto:${SUPPORT_EMAIL}`} /> }}
          />
        </p>
      </section>
    </LegalPage>
  );
}
