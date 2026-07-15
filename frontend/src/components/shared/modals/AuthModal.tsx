import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import Modal from "../Modal";
import Button from "../Button";
import { TextField } from "../Field";
import { useToast } from "../ToastProvider";
import { useSession } from "../SessionProvider";
import { endpoints } from "../../../lib/api/endpoints";
import { ApiClientError } from "../../../lib/api/client";
import { validateEmail, validatePassword, validateRequired } from "../../../utils/validation";
import { cn } from "../../../utils/cn";
import i18n from "../../../i18n";

export type AuthMode = "login" | "signup";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

interface Errors {
  name?: string | null;
  email?: string | null;
  password?: string | null;
}

const TABS: { value: AuthMode; labelKey: string }[] = [
  { value: "login", labelKey: "common.logIn" },
  { value: "signup", labelKey: "common.signUp" },
];

/** Derive a display name from an email for users who log in without providing one. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || i18n.t("authModal.nameFallback");
}

export default function AuthModal({ open, onClose, initialMode = "login" }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const session = useSession();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPassword("");
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  // Login only checks that a password was entered — the server verifies it.
  // Complexity rules (length/uppercase/number) apply only when *creating* one,
  // otherwise valid users whose password predates the rules can't sign in.
  const checkPassword = (value: string): string | null =>
    mode === "signup" ? validatePassword(value) : validateRequired(value, "Password");

  const validate = (): boolean => {
    const next: Errors = {
      email: validateEmail(email),
      password: checkPassword(password),
    };
    if (mode === "signup") next.name = validateRequired(name, "Name");
    setErrors(next);
    return !next.name && !next.email && !next.password;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await session.signup(name.trim(), email.trim(), password);
        onClose();
        toast.success(
          t("authModal.toast.welcomeTitle", { name: name.trim().split(" ")[0] }),
          t("authModal.toast.verifyBody")
        );
      } else {
        const user = await session.login(email.trim(), password);
        onClose();
        const displayName = user.name || nameFromEmail(email);
        toast.success(
          t("authModal.toast.welcomeBackTitle", { name: displayName.split(" ")[0] }),
          t("authModal.toast.signedInBody")
        );
      }
    } catch (err) {
      const apiErr = err instanceof ApiClientError ? err : null;
      const message = apiErr?.message ?? t("authModal.toast.genericError");
      if (apiErr?.status === 409) {
        setErrors((p) => ({ ...p, email: message }));
      } else if (apiErr?.status === 401) {
        setErrors((p) => ({ ...p, password: message }));
      } else {
        toast.error(
          mode === "signup" ? t("authModal.toast.createFailedTitle") : t("authModal.toast.signInFailedTitle"),
          message
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    const err = validateEmail(email);
    if (err) {
      setErrors((p) => ({ ...p, email: err }));
      toast.info(t("authModal.toast.enterEmailTitle"), t("authModal.toast.enterEmailBody"));
      return;
    }
    try {
      await endpoints.auth.forgotPassword(email.trim());
    } catch {
      /* endpoint always 200s; ignore transport hiccups */
    }
    toast.success(t("authModal.toast.resetSentTitle"), t("authModal.toast.resetSentBody", { email }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "login" ? t("authModal.title.login") : t("authModal.title.signup")}
      description={t("authModal.description")}
      size="md"
    >
      <div role="tablist" aria-label={t("authModal.tablistLabel")} className="mb-5 inline-flex rounded-full bg-bg-soft/60 p-1 ring-1 ring-white/10">
        {TABS.map((tab) => {
          const active = tab.value === mode;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(tab.value);
                setErrors({});
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                active ? "bg-brand-green text-bg" : "text-white/70 hover:text-white"
              )}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <TextField
            label={t("authModal.fullName")}
            type="text"
            autoComplete="name"
            placeholder="Alex Carter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setErrors((p) => ({ ...p, name: validateRequired(name, "Name") }))}
            error={errors.name}
            required
          />
        )}
        <TextField
          label={t("authModal.email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, email: validateEmail(email) }))}
          error={errors.email}
          required
        />

        <div>
          <TextField
            label={t("authModal.password")}
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setErrors((p) => ({ ...p, password: checkPassword(password) }))}
            error={errors.password}
            hint={mode === "signup" ? t("authModal.passwordHint") : undefined}
            required
          />
          {mode === "login" && (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[11px] font-semibold text-white/55 underline-offset-2 hover:text-brand-green hover:underline focus-visible:outline-none focus-visible:text-brand-green"
              >
                {t("authModal.forgotPassword")}
              </button>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          isLoading={submitting}
          loadingText={mode === "signup" ? t("authModal.creatingAccount") : t("authModal.signingIn")}
        >
          {mode === "signup" ? t("authModal.createAccount") : t("authModal.signIn")}
        </Button>

        <p className="pt-1 text-center text-[11px] text-white/45">
          <Trans
            i18nKey="authModal.legal"
            components={{
              terms: (
                <Link to="/terms" onClick={onClose} className="underline underline-offset-2 hover:text-white/70" />
              ),
              privacy: (
                <Link to="/privacy" onClick={onClose} className="underline underline-offset-2 hover:text-white/70" />
              ),
            }}
          />
        </p>
      </form>
    </Modal>
  );
}
