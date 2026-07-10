/** Pragmatic, dependency-free validators for the small forms in this app. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return null;
}

export function validateRequired(value: string, label = "This field"): string | null {
  return value.trim() ? null : `${label} is required.`;
}

export function validateMin(value: string, min: number, label = "This field"): string | null {
  return value.trim().length >= min ? null : `${label} must be at least ${min} characters.`;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
  if (!/[0-9]/.test(value)) return "Password must include a number.";
  return null;
}
