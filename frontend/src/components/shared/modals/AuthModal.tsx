import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../Modal";
import Button from "../Button";
import { TextField } from "../Field";
import { useToast } from "../ToastProvider";
import { useSession } from "../SessionProvider";
import { endpoints } from "../../../lib/api/endpoints";
import { ApiClientError } from "../../../lib/api/client";
import { validateEmail, validatePassword, validateRequired } from "../../../utils/validation";
import { cn } from "../../../utils/cn";

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

const TABS: { value: AuthMode; label: string }[] = [
  { value: "login", label: "Log in" },
  { value: "signup", label: "Sign up" },
];

/** Derive a display name from an email for users who log in without providing one. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || "Friend";
}

export default function AuthModal({ open, onClose, initialMode = "login" }: Props) {
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
        toast.success(`Welcome, ${name.trim().split(" ")[0]}!`, "Check your inbox to verify your email.");
      } else {
        const user = await session.login(email.trim(), password);
        onClose();
        const displayName = user.name || nameFromEmail(email);
        toast.success(`Welcome back, ${displayName.split(" ")[0]}!`, "You're signed in.");
      }
    } catch (err) {
      const apiErr = err instanceof ApiClientError ? err : null;
      const message = apiErr?.message ?? "Something went wrong. Please try again.";
      if (apiErr?.status === 409) {
        setErrors((p) => ({ ...p, email: message }));
      } else if (apiErr?.status === 401) {
        setErrors((p) => ({ ...p, password: message }));
      } else {
        toast.error(mode === "signup" ? "Couldn't create account" : "Couldn't sign in", message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    const err = validateEmail(email);
    if (err) {
      setErrors((p) => ({ ...p, email: err }));
      toast.info("Enter your email first", "We'll send the reset link to that address.");
      return;
    }
    try {
      await endpoints.auth.forgotPassword(email.trim());
    } catch {
      /* endpoint always 200s; ignore transport hiccups */
    }
    toast.success("Reset link sent", `If ${email} has an account, a reset link is on its way.`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "login" ? "Welcome back" : "Create your account"}
      description="Your Sniser wallet is created automatically — no seed phrases, no browser extensions."
      size="md"
    >
      <div role="tablist" aria-label="Authentication mode" className="mb-5 inline-flex rounded-full bg-bg-soft/60 p-1 ring-1 ring-white/10">
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
              {tab.label}
            </button>
          );
        })}
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <TextField
            label="Full name"
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
          label="Email"
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
            label="Password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setErrors((p) => ({ ...p, password: checkPassword(password) }))}
            error={errors.password}
            hint={mode === "signup" ? "At least 8 chars, one uppercase, one number." : undefined}
            required
          />
          {mode === "login" && (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[11px] font-semibold text-white/55 underline-offset-2 hover:text-brand-green hover:underline focus-visible:outline-none focus-visible:text-brand-green"
              >
                Forgot password?
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
          loadingText={mode === "signup" ? "Creating account…" : "Signing in…"}
        >
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>

        <p className="pt-1 text-center text-[11px] text-white/45">
          By continuing you agree to our{" "}
          <Link to="/terms" onClick={onClose} className="underline underline-offset-2 hover:text-white/70">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" onClick={onClose} className="underline underline-offset-2 hover:text-white/70">
            Privacy Policy
          </Link>.
        </p>
      </form>
    </Modal>
  );
}
