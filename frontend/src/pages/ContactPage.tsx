import { FormEvent, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Section from "../components/layout/Section";
import SectionHeading from "../components/shared/SectionHeading";
import Button from "../components/shared/Button";
import { TextField, TextArea } from "../components/shared/Field";
import { useToast } from "../components/shared/ToastProvider";
import { usePageMeta } from "../hooks/usePageMeta";
import { SUPPORT_EMAIL } from "../utils/constants";
import { env } from "../config/env";
import { endpoints } from "../lib/api/endpoints";
import type { ContactBody } from "../lib/api/endpoints";
import { ApiClientError } from "../lib/api/client";
import { validateEmail, validateMin, validateRequired } from "../utils/validation";

type Reason = "general" | "artist" | "press" | "support";

const REASONS: { value: Reason; labelKey: string; blurbKey: string }[] = [
  { value: "general", labelKey: "contact.reasons.general.label", blurbKey: "contact.reasons.general.blurb" },
  { value: "artist", labelKey: "contact.reasons.artist.label", blurbKey: "contact.reasons.artist.blurb" },
  { value: "press", labelKey: "contact.reasons.press.label", blurbKey: "contact.reasons.press.blurb" },
  { value: "support", labelKey: "contact.reasons.support.label", blurbKey: "contact.reasons.support.blurb" },
];

/** Map the friendly UI reasons onto the backend's routing topics. */
const TOPIC_MAP: Record<Reason, ContactBody["topic"]> = {
  general: "general",
  artist: "advertise",
  press: "press",
  support: "support",
};

interface Errors {
  name?: string | null;
  email?: string | null;
  message?: string | null;
}

export default function ContactPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("contact.meta.title"),
    description: t("contact.meta.description"),
    canonicalPath: "/contact",
  });

  const toast = useToast();
  const [reason, setReason] = useState<Reason>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const next: Errors = {
      name: validateRequired(name, "Name"),
      email: validateEmail(email),
      message: validateMin(message, 20, "Message"),
    };
    setErrors(next);
    return !next.name && !next.email && !next.message;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await endpoints.contact.submit({
        name: name.trim(),
        email: email.trim(),
        topic: TOPIC_MAP[reason],
        message: message.trim(),
        website,
      });
      setSent(true);
      toast.success(t("contact.toast.sentTitle"), t("contact.toast.sentBody"));
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : t("contact.toast.errorFallback");
      toast.error(t("contact.toast.errorTitle"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setWebsite("");
    setErrors({});
    setSent(false);
  };

  return (
    <>
      <Section tone="dark" spacing="md">
        <SectionHeading eyebrow={t("contact.hero.eyebrow")} align="left" className="max-w-2xl">
          {t("contact.hero.heading")}
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          {t("contact.hero.body")}
        </p>
      </Section>

      <Section tone="dark" spacing="sm">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Form */}
          <div className="rounded-2xl bg-bg-card p-6 sm:p-8 ring-1 ring-white/5">
            {sent ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-green/15 text-brand-green">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 13 4 4L20 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">{t("contact.sent.heading")}</h3>
                <p className="mt-1.5 text-sm text-white/60 text-pretty">
                  <Trans i18nKey="contact.sent.body" values={{ email }}>
                    Thanks — we'll reply to <span className="text-white">{"{{email}}"}</span> within one business day.
                  </Trans>
                </p>
                <div className="mt-6">
                  <Button variant="outline" size="sm" onClick={reset}>{t("contact.sent.sendAnother")}</Button>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/75">{t("contact.form.reasonLabel")}</label>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("contact.form.reasonAriaLabel")}>
                    {REASONS.map((r) => {
                      const active = reason === r.value;
                      return (
                        <button
                          type="button"
                          key={r.value}
                          role="radio"
                          aria-checked={active}
                          onClick={() => setReason(r.value)}
                          className={
                            "rounded-lg px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green " +
                            (active
                              ? "bg-brand-green/15 ring-1 ring-brand-green text-white"
                              : "bg-bg-soft/60 ring-1 ring-white/10 text-white/70 hover:ring-white/25 hover:text-white")
                          }
                        >
                          <span className="block font-bold">{t(r.labelKey)}</span>
                          <span className="block mt-0.5 text-[11px] text-white/55">{t(r.blurbKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <TextField
                  label={t("contact.form.name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setErrors((p) => ({ ...p, name: validateRequired(name, "Name") }))}
                  error={errors.name}
                  autoComplete="name"
                  placeholder="Alex Carter"
                  required
                />
                <TextField
                  label={t("contact.form.email")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setErrors((p) => ({ ...p, email: validateEmail(email) }))}
                  error={errors.email}
                  placeholder="you@example.com"
                  required
                />
                <TextArea
                  label={t("contact.form.message")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onBlur={() => setErrors((p) => ({ ...p, message: validateMin(message, 20, "Message") }))}
                  error={errors.message}
                  placeholder={t("contact.form.messagePlaceholder")}
                  hint={t("contact.form.messageHint")}
                  rows={5}
                  required
                />
                {/* Honeypot — hidden from users, tempting to bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="contact-website">Leave this field empty</label>
                  <input
                    id="contact-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <Button type="submit" variant="primary" size="md" fullWidth isLoading={submitting} loadingText={t("contact.form.sending")}>
                  {t("contact.form.submit")}
                </Button>
              </form>
            )}
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-bold tracking-widestPlus uppercase text-white">{t("contact.panel.otherChannels")}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-brand-green/15 text-brand-green">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                      <path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-white">{t("contact.panel.email")}</p>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-white/65 hover:text-brand-green transition-colors">
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-brand-green/15 text-brand-green">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path d="M19.05 4.92A10 10 0 0 0 4.84 19.05L4 22l3.05-.8A10 10 0 1 0 19.05 4.92Zm-7.04 15.4a8.39 8.39 0 0 1-4.27-1.17l-.3-.18-1.82.48.49-1.77-.2-.31a8.4 8.4 0 1 1 6.1 2.95Z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-white">WhatsApp</p>
                    <a href={env.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-white/65 hover:text-brand-green transition-colors">
                      {t("contact.panel.openChat")}
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-bold tracking-widestPlus uppercase text-white">{t("contact.panel.office")}</h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                Sniser Ltd<br />
                3rd Floor, 86–90 Paul Street<br />
                London EC2A 4NE, UK
              </p>
              <p className="mt-3 text-xs text-white/45">
                {t("contact.panel.remoteNote")}
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
