/**
 * Type-safe access to Vite env vars. Only variables prefixed with `VITE_`
 * are exposed to the client bundle. Validate / fall back here, never read
 * `import.meta.env` ad-hoc from feature code.
 */

function readUrl(value: string | undefined, fallback: string, label: string): string {
  const raw = (value ?? fallback).trim();
  try {
    // Throws on malformed URLs.
    new URL(raw);
    return raw.replace(/\/+$/, ""); // strip trailing slashes
  } catch {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[env] ${label} is not a valid URL: "${raw}". Falling back to ${fallback}`);
    }
    return fallback.replace(/\/+$/, "");
  }
}

/**
 * Optional href used for unconfigured CTAs (sign up, log in, etc). When the
 * env var is empty, callers render a placeholder "#" so the button still
 * functions as a focusable, keyboard-reachable element. Detect via
 * `isPlaceholderHref` from `utils/url`.
 */
function readOptionalUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "#";
  try {
    new URL(raw);
    return raw.replace(/\/+$/, "");
  } catch {
    return "#";
  }
}

const apiUrl = readUrl(
  import.meta.env.VITE_API_URL as string | undefined,
  "http://localhost:4000/api/v1",
  "VITE_API_URL"
);

/** Origin of the API (no path) — used to resolve static upload URLs. */
const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "http://localhost:4000";
  }
})();

const whatsappUrl = readUrl(
  import.meta.env.VITE_WHATSAPP_URL as string | undefined,
  "https://wa.me/447000000000",
  "VITE_WHATSAPP_URL"
);

const siteUrl = readUrl(
  import.meta.env.VITE_SITE_URL as string | undefined,
  typeof window !== "undefined" ? window.location.origin : "https://sniser.example.com",
  "VITE_SITE_URL"
);

const auth = {
  signupUrl: readOptionalUrl(import.meta.env.VITE_AUTH_SIGNUP_URL as string | undefined),
  loginUrl: readOptionalUrl(import.meta.env.VITE_AUTH_LOGIN_URL as string | undefined),
};

const business = {
  advertiseUrl: readOptionalUrl(import.meta.env.VITE_ADVERTISE_URL as string | undefined),
  walletConnectUrl: readOptionalUrl(import.meta.env.VITE_WALLET_CONNECT_URL as string | undefined),
};

const social = {
  instagram: readOptionalUrl(import.meta.env.VITE_SOCIAL_INSTAGRAM as string | undefined),
  facebook: readOptionalUrl(import.meta.env.VITE_SOCIAL_FACEBOOK as string | undefined),
  twitter: readOptionalUrl(import.meta.env.VITE_SOCIAL_TWITTER as string | undefined),
  linkedin: readOptionalUrl(import.meta.env.VITE_SOCIAL_LINKEDIN as string | undefined),
};

export const env = {
  apiUrl,
  apiOrigin,
  whatsappUrl,
  siteUrl,
  auth,
  business,
  social,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

export type Env = typeof env;
