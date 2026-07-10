import { FormEvent, useEffect, useRef, useState } from "react";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import { TextField } from "../components/shared/Field";
import { useToast } from "../components/shared/ToastProvider";
import { useSession, initialsFromName } from "../components/shared/SessionProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { endpoints } from "../lib/api/endpoints";
import { ApiClientError } from "../lib/api/client";
import { assetUrl } from "../lib/assets";
import type { NotificationItem } from "../lib/api/types";
import { validatePassword } from "../utils/validation";

export default function AccountPage() {
  usePageMeta({
    title: "Account — Sniser",
    description: "Manage your Sniser profile, security, and notifications.",
    canonicalPath: "/account",
  });

  const toast = useToast();
  const { user, applyUser } = useSession();

  const [name, setName] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [resending, setResending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const loadNotifications = () => {
    endpoints.notifications
      .list()
      .then((res) => {
        setNotifications(res.notifications);
        setUnread(res.unread);
      })
      .catch(() => {
        /* non-critical */
      });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  if (!user) return null;

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : assetUrl(user.avatarUrl);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Name too short", "Enter at least 2 characters.");
      return;
    }
    setSavingProfile(true);
    try {
      const form = new FormData();
      if (name.trim() !== user.name) form.append("name", name.trim());
      if (avatarFile) form.append("avatar", avatarFile);
      const { user: updated } = await endpoints.users.updateProfile(form);
      applyUser({ name: updated.name, avatarUrl: updated.avatarUrl });
      setAvatarFile(null);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Couldn't save", err instanceof ApiClientError ? err.message : "Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      await endpoints.auth.resendVerification();
      toast.success("Verification sent", "Check your inbox for the confirmation link.");
    } catch (err) {
      toast.error("Couldn't send", err instanceof ApiClientError ? err.message : "Please try again.");
    } finally {
      setResending(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    const err = validatePassword(next);
    if (err) {
      setPwError(err);
      return;
    }
    setPwError(null);
    setSavingPw(true);
    try {
      await endpoints.auth.changePassword(current, next);
      setCurrent("");
      setNext("");
      toast.success("Password changed", "Use your new password next time you sign in.");
    } catch (error) {
      toast.error("Couldn't change password", error instanceof ApiClientError ? error.message : "Please try again.");
    } finally {
      setSavingPw(false);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await endpoints.notifications.markRead();
      setUnread(res.unread);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow="Account" align="left" className="max-w-2xl">
          Your account
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          Update your profile, secure your account, and review recent activity.
        </p>
      </Section>

      <Section tone="dark" spacing="sm">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile */}
          <form onSubmit={saveProfile} className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
            <h2 className="text-sm font-bold uppercase tracking-widestPlus text-white">Profile</h2>
            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-green to-brand-greenDark text-bg text-lg font-extrabold">
                    {initialsFromName(user.name)}
                  </span>
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="dark" size="sm" onClick={() => fileRef.current?.click()}>
                  {avatarFile ? "Change photo" : "Upload photo"}
                </Button>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => setAvatarFile(null)}
                    className="ml-2 text-xs text-white/50 hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/75">Email</label>
                <div className="flex items-center gap-2 rounded-lg bg-bg-soft/40 border border-white/10 px-3.5 py-2.5">
                  <span className="flex-1 truncate text-sm text-white/70">{user.email}</span>
                  {user.emailVerified ? (
                    <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-green">
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Unverified
                    </span>
                  )}
                </div>
                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={resending}
                    className="mt-2 text-xs font-semibold text-white/60 underline-offset-2 hover:text-brand-green hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5">
              <Button type="submit" variant="primary" size="md" isLoading={savingProfile} loadingText="Saving…">
                Save changes
              </Button>
            </div>
          </form>

          {/* Security */}
          <form onSubmit={changePassword} className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
            <h2 className="text-sm font-bold uppercase tracking-widestPlus text-white">Security</h2>
            <p className="mt-2 text-xs text-white/55">
              Changing your password signs you out of other devices.
            </p>
            <div className="mt-5 space-y-4">
              <TextField
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
              <TextField
                label="New password"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                onBlur={() => setPwError(validatePassword(next))}
                error={pwError}
                hint="At least 8 chars, one uppercase, one number."
                required
              />
            </div>
            <div className="mt-5">
              <Button type="submit" variant="primary" size="md" isLoading={savingPw} loadingText="Updating…">
                Update password
              </Button>
            </div>
          </form>
        </div>

        {/* Notifications */}
        <div className="mt-6 rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widestPlus text-white">
              Notifications {unread > 0 && <span className="ml-1 text-brand-green">({unread})</span>}
            </h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-white/55 hover:text-brand-green focus-visible:outline-none focus-visible:text-brand-green"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-4">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/50">You're all caught up.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-white/15" : "bg-brand-green"}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-white/60 text-pretty">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-white/40">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
