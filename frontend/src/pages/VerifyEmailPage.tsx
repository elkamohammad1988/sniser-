import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import Section from "../components/layout/Section";
import Button from "../components/shared/Button";
import Spinner from "../components/shared/Spinner";
import { useSession } from "../components/shared/SessionProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { endpoints } from "../lib/api/endpoints";
import { ApiClientError } from "../lib/api/client";

type Status = "verifying" | "success" | "error" | "missing";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  usePageMeta({ title: t("verifyEmail.meta.title"), canonicalPath: "/verify-email" });

  const [params] = useSearchParams();
  const token = params.get("token");
  const { applyUser } = useSession();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "missing");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    endpoints.auth
      .verifyEmail(token)
      .then(() => {
        applyUser({ emailVerified: true });
        setStatus("success");
      })
      .catch((err) => {
        setMessage(err instanceof ApiClientError ? err.message : t("verifyEmail.linkInvalid"));
        setStatus("error");
      });
  }, [token, applyUser, t]);

  return (
    <Section tone="dark" spacing="lg">
      <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
        {status === "verifying" && (
          <>
            <Spinner size="lg" className="mx-auto text-brand-green" />
            <p className="mt-5 text-sm text-white/60">{t("verifyEmail.verifying")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 13 4 4L20 6" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">{t("verifyEmail.successTitle")}</h1>
            <p className="mt-1.5 text-sm text-white/60">{t("verifyEmail.successBody")}</p>
            <div className="mt-6 flex justify-center gap-2">
              <Link to="/browse"><Button variant="primary" size="md">{t("common.browseCatalog")}</Button></Link>
              <Link to="/account"><Button variant="outline" size="md">{t("verifyEmail.goToAccount")}</Button></Link>
            </div>
          </>
        )}

        {(status === "error" || status === "missing") && (
          <>
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-400">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 8v5m0 3.5v.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">
              {status === "missing" ? t("verifyEmail.missingTitle") : t("verifyEmail.errorTitle")}
            </h1>
            <p className="mt-1.5 text-sm text-white/60">
              {status === "missing"
                ? t("verifyEmail.missingBody")
                : message}
            </p>
            <p className="mt-3 text-xs text-white/45">
              {t("verifyEmail.requestFresh")}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link to="/account"><Button variant="primary" size="md">{t("verifyEmail.goToAccount")}</Button></Link>
              <Link to="/"><Button variant="outline" size="md">{t("verifyEmail.home")}</Button></Link>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
