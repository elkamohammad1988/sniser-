/**
 * Inline payment-brand marks rendered as SVG. Each logo accepts standard SVG
 * props so callers can size and recolor via Tailwind on the wrapping element.
 *
 * Marks are simplified, neutralized typographic representations — they are
 * recognisable but do not reproduce the registered logos pixel-for-pixel.
 * That keeps the bundle dependency-free while staying brand-respectful.
 */

import { SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement>;

export function VisaLogo(props: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 16"
      role="img"
      aria-label="VISA"
      fontFamily="Inter, system-ui, sans-serif"
      {...props}
    >
      <text
        x="24"
        y="13"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="0.05em"
        fill="currentColor"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo(props: LogoProps) {
  return (
    <svg viewBox="0 0 48 28" role="img" aria-label="Mastercard" {...props}>
      <circle cx="19" cy="14" r="10" fill="#EB001B" />
      <circle cx="29" cy="14" r="10" fill="#F79E1B" />
      <path
        d="M24 6.5a10 10 0 0 0 0 15 10 10 0 0 0 0-15Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function ApplePayLogo(props: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 20"
      role="img"
      aria-label="Apple Pay"
      fontFamily="Inter, system-ui, sans-serif"
      {...props}
    >
      {/* Apple glyph */}
      <path
        d="M11.2 6.8c-.5.6-1.3 1.1-2 1-.1-.8.3-1.6.7-2.1.5-.6 1.3-1 2-1.1.1.8-.2 1.6-.7 2.2Zm.7.8c-1.1-.1-2 .6-2.5.6s-1.3-.6-2.1-.6c-1.1 0-2.1.6-2.6 1.6-1.1 2-.3 4.9.8 6.5.5.8 1.1 1.6 2 1.6.8 0 1.1-.5 2.1-.5s1.3.5 2.1.5c.9 0 1.5-.8 2-1.6.6-.9.9-1.8.9-1.8 0-.1-1.7-.7-1.7-2.7 0-1.7 1.4-2.5 1.4-2.6-.8-1.1-2-1.2-2.4-1.3Z"
        fill="currentColor"
      />
      {/* "Pay" text */}
      <text
        x="22"
        y="14.5"
        fontSize="12"
        fontWeight="700"
        fill="currentColor"
      >
        Pay
      </text>
    </svg>
  );
}

export function GooglePayLogo(props: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 20"
      role="img"
      aria-label="Google Pay"
      fontFamily="Inter, system-ui, sans-serif"
      {...props}
    >
      <text x="0" y="14.5" fontSize="12" fontWeight="700" fill="#4285F4">G</text>
      <text x="8" y="14.5" fontSize="12" fontWeight="700" fill="#EA4335">o</text>
      <text x="16" y="14.5" fontSize="12" fontWeight="700" fill="#FBBC04">o</text>
      <text x="24" y="14.5" fontSize="12" fontWeight="700" fill="#4285F4">g</text>
      <text x="32" y="14.5" fontSize="12" fontWeight="700" fill="#34A853">l</text>
      <text x="36" y="14.5" fontSize="12" fontWeight="700" fill="#EA4335">e</text>
      <text x="46" y="14.5" fontSize="12" fontWeight="700" fill="currentColor">Pay</text>
    </svg>
  );
}
