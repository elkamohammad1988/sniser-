import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import Button from "../Button";
import { TextArea, TextField } from "../Field";
import { useToast } from "../ToastProvider";
import { validateEmail, validateMin, validateRequired } from "../../../utils/validation";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Errors {
  brand?: string | null;
  email?: string | null;
  budget?: string | null;
  message?: string | null;
}

const BUDGETS = [
  "advertiseModal.budgets.under5k",
  "advertiseModal.budgets.5to20k",
  "advertiseModal.budgets.20to50k",
  "advertiseModal.budgets.50kPlus",
] as const;

export default function AdvertiseModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState<typeof BUDGETS[number] | "">("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setBrand("");
      setEmail("");
      setBudget("");
      setMessage("");
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const validate = (): boolean => {
    const next: Errors = {
      brand: validateRequired(brand, "Brand"),
      email: validateEmail(email),
      budget: budget ? null : t("advertiseModal.budgetRequired"),
      message: validateMin(message, 20, "Message"),
    };
    setErrors(next);
    return !next.brand && !next.email && !next.budget && !next.message;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      onClose();
      toast.success(
        t("advertiseModal.toast.sentTitle"),
        t("advertiseModal.toast.sentBody")
      );
    }, 700);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("advertiseModal.title")}
      description={t("advertiseModal.description")}
      size="md"
    >
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <TextField
          label={t("advertiseModal.brandLabel")}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, brand: validateRequired(brand, "Brand") }))}
          error={errors.brand}
          placeholder="Acme Records"
          required
        />
        <TextField
          label={t("advertiseModal.emailLabel")}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, email: validateEmail(email) }))}
          error={errors.email}
          placeholder="you@brand.com"
          required
        />
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/75">{t("advertiseModal.budgetRange")}</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t("advertiseModal.budgetRange")}>
            {BUDGETS.map((b) => {
              const active = budget === b;
              return (
                <button
                  type="button"
                  key={b}
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setBudget(b);
                    setErrors((p) => ({ ...p, budget: null }));
                  }}
                  className={
                    "rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green " +
                    (active
                      ? "bg-brand-green text-bg ring-1 ring-brand-green"
                      : "bg-bg-soft/60 text-white/75 ring-1 ring-white/10 hover:ring-white/25")
                  }
                >
                  {t(b)}
                </button>
              );
            })}
          </div>
          {errors.budget && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-400">{errors.budget}</p>
          )}
        </div>
        <TextArea
          label={t("advertiseModal.campaignLabel")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onBlur={() => setErrors((p) => ({ ...p, message: validateMin(message, 20, "Message") }))}
          error={errors.message}
          placeholder={t("advertiseModal.campaignPlaceholder")}
          hint={t("advertiseModal.campaignHint")}
          rows={4}
          required
        />
        <Button type="submit" variant="primary" size="md" fullWidth isLoading={submitting} loadingText={t("advertiseModal.sending")}>
          {t("advertiseModal.sendRequest")}
        </Button>
      </form>
    </Modal>
  );
}
