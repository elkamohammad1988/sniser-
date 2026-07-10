import { FormEvent, useState } from "react";
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

const REASONS: { value: Reason; label: string; blurb: string }[] = [
  { value: "general", label: "General", blurb: "Anything not covered below." },
  { value: "artist", label: "Artist onboarding", blurb: "You make music and want to release on Sniser." },
  { value: "press", label: "Press & partnerships", blurb: "Media, brands, or partnership requests." },
  { value: "support", label: "Account support", blurb: "Login, payments, wallet issues." },
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
  usePageMeta({
    title: "Contact Sniser",
    description:
      "Talk to the Sniser team about onboarding as an artist, partnerships, press, or account support.",
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
      toast.success("Message sent", "We'll reply within one business day.");
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Please try again in a moment.";
      toast.error("Couldn't send message", msg);
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
        <SectionHeading eyebrow="Contact" align="left" className="max-w-2xl">
          Get in touch.
        </SectionHeading>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/65 text-pretty">
          Tell us what you need help with — we route messages to the right person automatically.
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
                <h3 className="text-lg font-bold text-white">Message received</h3>
                <p className="mt-1.5 text-sm text-white/60 text-pretty">
                  Thanks — we'll reply to <span className="text-white">{email}</span> within one business day.
                </p>
                <div className="mt-6">
                  <Button variant="outline" size="sm" onClick={reset}>Send another message</Button>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/75">What's this about?</label>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Contact reason">
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
                          <span className="block font-bold">{r.label}</span>
                          <span className="block mt-0.5 text-[11px] text-white/55">{r.blurb}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setErrors((p) => ({ ...p, name: validateRequired(name, "Name") }))}
                  error={errors.name}
                  autoComplete="name"
                  placeholder="Alex Carter"
                  required
                />
                <TextField
                  label="Email"
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
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onBlur={() => setErrors((p) => ({ ...p, message: validateMin(message, 20, "Message") }))}
                  error={errors.message}
                  placeholder="A few sentences about what you need…"
                  hint="At least 20 characters."
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

                <Button type="submit" variant="primary" size="md" fullWidth isLoading={submitting} loadingText="Sending…">
                  Send message
                </Button>
              </form>
            )}
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-bold tracking-widestPlus uppercase text-white">Other channels</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-brand-green/15 text-brand-green">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                      <path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-white">Email</p>
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
                      Open chat →
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-bg-card p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-bold tracking-widestPlus uppercase text-white">Office</h3>
              <p className="mt-3 text-sm text-white/65 leading-relaxed">
                Sniser Ltd<br />
                3rd Floor, 86–90 Paul Street<br />
                London EC2A 4NE, UK
              </p>
              <p className="mt-3 text-xs text-white/45">
                We're remote-first. The London address is registered office and mail handling.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
