import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Section from "../layout/Section";
import Button from "./Button";
import Spinner from "./Spinner";
import { useSession } from "./SessionProvider";
import { useModal } from "./ModalProvider";

interface Props {
  children: ReactNode;
  /** Restrict to a role. `admin` also implicitly allows admins on artist pages. */
  role?: "artist" | "admin";
}

/**
 * Client-side route guard. Waits for session bootstrap, shows a sign-in gate to
 * anonymous visitors, and enforces role for role-restricted pages. The server
 * is always the real authority — this only shapes the UX.
 */
export default function RequireAuth({ children, role }: Props) {
  const { status, user } = useSession();
  const modal = useModal();

  if (status === "loading") {
    return (
      <Section tone="dark" spacing="lg">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" className="text-brand-green" />
        </div>
      </Section>
    );
  }

  if (status === "anonymous" || !user) {
    return (
      <Section tone="dark" spacing="lg">
        <div className="mx-auto max-w-md rounded-2xl bg-bg-card p-10 text-center ring-1 ring-white/5">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white">Sign in to continue</h1>
          <p className="mt-1.5 text-sm text-white/60">
            You need an account to access this page.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="primary" size="md" onClick={() => modal.openAuth({ mode: "login" })}>
              Log in
            </Button>
            <Button variant="outline" size="md" onClick={() => modal.openAuth({ mode: "signup" })}>
              Sign up
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  if (role === "admin" && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
