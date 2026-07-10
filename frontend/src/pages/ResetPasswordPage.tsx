import { FormEvent, useState } from "react";
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
  usePageMeta({ title: "Reset password — Sniser", canonicalPath: "/reset-password" });

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
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await endpoints.auth.resetPassword(token, password);
      setDone(true);
      toast.success("Password reset", "You can now sign in with your new password.");
    } catch (err) {
      toast.error("Couldn't reset password", err instanceof ApiClientError ? err.message : "The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section tone="dark" spacing="lg">
      <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-8 ring-1 ring-white/5">
        {!token ? (
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">Invalid reset link</h1>
            <p className="mt-1.5 text-sm text-white/60">
              This page needs a valid reset token. Request a new link from the login screen.
            </p>
            <div className="mt-6">
              <Link to="/"><Button variant="primary" size="md">Back home</Button></Link>
            </div>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 13 4 4L20 6" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">Password updated</h1>
            <p className="mt-1.5 text-sm text-white/60">Sign in with your new password to continue.</p>
            <div className="mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  navigate("/");
                  modal.openAuth({ mode: "login" });
                }}
              >
                Sign in
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold text-white">Choose a new password</h1>
            <p className="mt-1.5 text-sm text-white/60">Make it at least 8 characters with an uppercase letter and a number.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <TextField
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required
              />
              <TextField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" size="md" fullWidth isLoading={submitting} loadingText="Saving…">
                Reset password
              </Button>
            </form>
          </>
        )}
      </div>
    </Section>
  );
}
