/** Pragmatic, dependency-free validators for the small forms in this app. */
import i18n from "../i18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return i18n.t("validation.emailRequired");
  if (!EMAIL_RE.test(v)) return i18n.t("validation.emailInvalid");
  return null;
}

export function validateRequired(value: string, label = i18n.t("fields.thisField")): string | null {
  return value.trim() ? null : i18n.t("validation.required", { field: label });
}

export function validateMin(value: string, min: number, label = i18n.t("fields.thisField")): string | null {
  return value.trim().length >= min
    ? null
    : i18n.t("validation.minLength", { field: label, min });
}

export function validatePassword(value: string): string | null {
  if (!value) return i18n.t("validation.passwordRequired");
  if (value.length < 8) return i18n.t("validation.passwordMinLength", { min: 8 });
  if (!/[A-Z]/.test(value)) return i18n.t("validation.passwordUppercase");
  if (!/[0-9]/.test(value)) return i18n.t("validation.passwordNumber");
  return null;
}
