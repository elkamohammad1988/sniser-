import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Section from "../components/layout/Section";
import Button from "../components/shared/Button";
import { TextField } from "../components/shared/Field";
import { useToast } from "../components/shared/ToastProvider";
import { useModal } from "../components/shared/ModalProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { endpoints } from "../lib/api/endpoints";
import { ApiClientError } from "../lib/api/client";
import { validatePassword } from "../utils/validation";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  usePageMeta({ title: t("resetPassword.meta.title"), canonicalPath: "/reset-password" });

  const [params] = useSearchParams();
  const token = params.get("token");
  const toast = useToast();
  const modal = useModal();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (password !== confirm) {
      setError(t("resetPassword.passwordsMismatch"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await endpoints.auth.resetPassword(token, password);
      setDone(true);
      toast.success(t("resetPassword.toast.successTitle"), t("resetPassword.toast.successBody"));
    } catch (err) {
      toast.error(t("resetPassword.toast.errorTitle"), err instanceof ApiClientError ? err.message : t("resetPassword.toast.errorFallback"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section tone="dark" spacing="lg">
      <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-8 ring-1 ring-white/5">
        {!token ? (
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">{t("resetPassword.invalidTitle")}</h1>
            <p className="mt-1.5 text-sm text-white/60">
              {t("resetPassword.invalidBody")}
            </p>
            <div className="mt-6">
              <Link to="/"><Button variant="primary" size="md">{t("resetPassword.backHome")}</Button></Link>
            </div>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 13 4 4L20 6" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">{t("resetPassword.doneTitle")}</h1>
            <p className="mt-1.5 text-sm text-white/60">{t("resetPassword.doneBody")}</p>
            <div className="mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  navigate("/");
                  modal.openAuth({ mode: "login" });
                }}
              >
                {t("resetPassword.signIn")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold text-white">{t("resetPassword.chooseTitle")}</h1>
            <p className="mt-1.5 text-sm text-white/60">{t("resetPassword.chooseBody")}</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <TextField
                label={t("resetPassword.newPassword")}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required
              />
              <TextField
                label={t("resetPassword.confirmPassword")}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" size="md" fullWidth isLoading={submitting} loadingText={t("resetPassword.saving")}>
                {t("resetPassword.submit")}
              </Button>
            </form>
          </>
        )}
      </div>
    </Section>
  );
}
