/**
 * Inline SVG illustrations used across the Viewer and Artist pages.
 * Each illustration is a self-contained component that fills its parent —
 * pair with the `MediaFrame`-style aspect wrapper for consistent sizing.
 *
 * Palette is intentionally constrained to the Sniser brand tokens so the
 * illustrations adapt to both green and dark surfaces:
 *   - #A6E84D  brand green
 *   - #1C1F24  bg / ink
 *   - #262A30  bg-card
 *   - #F4F4F1  light surface
 */

import { SVGProps } from "react";

type Tone = "dark" | "green" | "light";

interface BaseProps extends SVGProps<SVGSVGElement> {
  /** Background tone of the parent surface — drives illustration palette. */
  tone?: Tone;
}

const GREEN = "#A6E84D";
const GREEN_DARK = "#8BCB35";
const INK = "#1C1F24";
const CARD = "#262A30";
const WHITE = "#FFFFFF";

/** Surface color used as the "page" inside the illustration. */
function surfaceFor(tone: Tone) {
  if (tone === "green") return "rgba(28,31,36,0.08)";
  if (tone === "light") return "rgba(28,31,36,0.05)";
  return "rgba(255,255,255,0.04)";
}

// ────────────────────────────────────────────────────────────────────────────
// Viewer-page illustrations
// ────────────────────────────────────────────────────────────────────────────

export function ViewerHeroIllustration({ tone = "green", ...rest }: BaseProps) {
  const accent = tone === "green" ? INK : GREEN;
  return (
    <svg
      viewBox="0 0 480 360"
      role="img"
      aria-label="Person browsing exclusive Sniser content on a laptop"
      {...rest}
    >
      <defs>
        <linearGradient id="vh-scr" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={INK} />
          <stop offset="100%" stopColor={CARD} />
        </linearGradient>
      </defs>

      {/* soft backdrop blob */}
      <circle cx="320" cy="170" r="140" fill={accent} opacity="0.12" />
      <circle cx="120" cy="240" r="80" fill={accent} opacity="0.08" />

      {/* laptop */}
      <g transform="translate(120 90)">
        <rect x="0" y="0" width="240" height="150" rx="10" fill={INK} />
        <rect x="10" y="10" width="220" height="130" rx="6" fill="url(#vh-scr)" />

        {/* screen content */}
        <rect x="26" y="28" width="80" height="10" rx="3" fill={GREEN} />
        <rect x="26" y="46" width="140" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
        <rect x="26" y="58" width="110" height="6" rx="3" fill="rgba(255,255,255,0.2)" />

        <rect x="26" y="78" width="86" height="48" rx="6" fill="rgba(166,232,77,0.85)" />
        <polygon points="64,94 64,110 80,102" fill={INK} />

        <rect x="122" y="78" width="86" height="22" rx="4" fill="rgba(255,255,255,0.08)" />
        <rect x="122" y="106" width="86" height="20" rx="4" fill="rgba(255,255,255,0.08)" />

        {/* laptop base */}
        <rect x="-12" y="150" width="264" height="10" rx="4" fill={INK} />
      </g>

      {/* figure to the left */}
      <g transform="translate(40 130)">
        <circle cx="40" cy="40" r="22" fill={accent} />
        <rect x="22" y="60" width="36" height="56" rx="10" fill={accent} />
        <rect x="22" y="116" width="14" height="44" rx="6" fill={INK} opacity="0.85" />
        <rect x="44" y="116" width="14" height="44" rx="6" fill={INK} opacity="0.85" />
      </g>

      {/* floating decoration */}
      <g transform="translate(370 60)" fill={accent}>
        <path d="M0 14 L14 0 L28 14 L14 28 Z" opacity="0.9" />
      </g>
      <circle cx="100" cy="80" r="6" fill={accent} />
    </svg>
  );
}

export function SignInIllustration({ tone = "light", ...rest }: BaseProps) {
  return (
    <svg
      viewBox="0 0 360 270"
      role="img"
      aria-label="Sign in card with Crossmint login providers"
      {...rest}
    >
      {/* background */}
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* phone frame */}
      <g transform="translate(110 30)">
        <rect x="0" y="0" width="140" height="220" rx="22" fill={INK} />
        <rect x="6" y="10" width="128" height="200" rx="16" fill={WHITE} />

        {/* header */}
        <rect x="20" y="26" width="60" height="10" rx="3" fill={INK} />
        <rect x="20" y="42" width="90" height="6" rx="3" fill="rgba(28,31,36,0.4)" />

        {/* card */}
        <rect x="18" y="64" width="104" height="38" rx="8" fill={GREEN} />
        <rect x="28" y="76" width="60" height="6" rx="3" fill={INK} />
        <rect x="28" y="88" width="40" height="5" rx="2" fill={INK} opacity="0.6" />

        {/* login buttons */}
        <rect x="18" y="112" width="104" height="22" rx="6" fill="rgba(28,31,36,0.08)" />
        <circle cx="32" cy="123" r="5" fill={GREEN_DARK} />
        <rect x="44" y="120" width="60" height="6" rx="2" fill={INK} opacity="0.7" />

        <rect x="18" y="142" width="104" height="22" rx="6" fill="rgba(28,31,36,0.08)" />
        <circle cx="32" cy="153" r="5" fill="#5C6470" />
        <rect x="44" y="150" width="60" height="6" rx="2" fill={INK} opacity="0.7" />

        <rect x="18" y="176" width="104" height="24" rx="6" fill={INK} />
        <rect x="48" y="184" width="44" height="8" rx="3" fill={GREEN} />
      </g>

      {/* sparkle accents */}
      <g fill={GREEN}>
        <path d="M40 60 l8 -8 l8 8 l-8 8 z" />
        <path d="M310 200 l10 -10 l10 10 l-10 10 z" />
        <circle cx="300" cy="70" r="4" />
        <circle cx="60" cy="210" r="3" />
      </g>
    </svg>
  );
}

export function VerifyAccessIllustration({ tone = "dark", ...rest }: BaseProps) {
  return (
    <svg
      viewBox="0 0 360 270"
      role="img"
      aria-label="Phone showing wallet access verified"
      {...rest}
    >
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* halo */}
      <circle cx="180" cy="135" r="100" fill={GREEN} opacity="0.12" />
      <circle cx="180" cy="135" r="70" fill={GREEN} opacity="0.18" />

      {/* phone */}
      <g transform="translate(130 20)">
        <rect x="0" y="0" width="100" height="200" rx="18" fill={INK} stroke={GREEN} strokeOpacity="0.4" />
        <rect x="6" y="10" width="88" height="180" rx="12" fill={CARD} />

        {/* checkmark badge */}
        <circle cx="50" cy="95" r="28" fill={GREEN} />
        <path
          d="M38 96 l8 8 l16 -18"
          fill="none"
          stroke={INK}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect x="20" y="140" width="60" height="7" rx="3" fill={GREEN} />
        <rect x="18" y="154" width="64" height="5" rx="2" fill="rgba(255,255,255,0.3)" />
        <rect x="24" y="166" width="52" height="5" rx="2" fill="rgba(255,255,255,0.2)" />
      </g>

      {/* sparkles */}
      <g fill={GREEN}>
        <path d="M60 80 l6 -6 l6 6 l-6 6 z" />
        <path d="M290 90 l8 -8 l8 8 l-8 8 z" />
        <circle cx="80" cy="200" r="3" />
        <circle cx="280" cy="200" r="3" />
      </g>
    </svg>
  );
}

export function ContentUnlocksIllustration({ tone = "green", ...rest }: BaseProps) {
  const accent = tone === "green" ? INK : GREEN;
  return (
    <svg
      viewBox="0 0 360 270"
      role="img"
      aria-label="Exclusive content video playing"
      {...rest}
    >
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* video frame */}
      <g transform="translate(40 50)">
        <rect x="0" y="0" width="280" height="170" rx="14" fill={INK} />
        <rect x="8" y="8" width="264" height="142" rx="10" fill={CARD} />

        {/* mock cityscape silhouette */}
        <rect x="20" y="100" width="20" height="50" fill="rgba(255,255,255,0.12)" />
        <rect x="44" y="80" width="28" height="70" fill="rgba(255,255,255,0.18)" />
        <rect x="76" y="92" width="22" height="58" fill="rgba(255,255,255,0.14)" />
        <rect x="102" y="68" width="36" height="82" fill="rgba(255,255,255,0.2)" />
        <rect x="142" y="84" width="26" height="66" fill="rgba(255,255,255,0.15)" />
        <rect x="172" y="58" width="32" height="92" fill="rgba(255,255,255,0.22)" />
        <rect x="208" y="80" width="24" height="70" fill="rgba(255,255,255,0.16)" />
        <rect x="236" y="96" width="28" height="54" fill="rgba(255,255,255,0.14)" />

        {/* play button */}
        <circle cx="140" cy="80" r="26" fill={accent} />
        <polygon points="132,68 132,92 152,80" fill={tone === "green" ? GREEN : INK} />

        {/* controls bar */}
        <rect x="8" y="152" width="264" height="14" rx="4" fill="rgba(0,0,0,0.5)" />
        <rect x="20" y="158" width="120" height="3" rx="2" fill={accent} />
        <rect x="140" y="158" width="120" height="3" rx="2" fill="rgba(255,255,255,0.25)" />
      </g>

      {/* sparkles */}
      <g fill={accent}>
        <path d="M20 30 l8 -8 l8 8 l-8 8 z" />
        <path d="M320 220 l8 -8 l8 8 l-8 8 z" />
      </g>
    </svg>
  );
}

export function MultiDeviceIllustration({ tone = "light", ...rest }: BaseProps) {
  return (
    <svg
      viewBox="0 0 360 270"
      role="img"
      aria-label="Sniser content available on laptop, tablet and phone"
      {...rest}
    >
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* laptop */}
      <g transform="translate(40 60)">
        <rect x="0" y="0" width="200" height="130" rx="8" fill={INK} />
        <rect x="8" y="8" width="184" height="114" rx="4" fill={CARD} />
        <rect x="22" y="22" width="60" height="8" rx="3" fill={GREEN} />
        <rect x="22" y="36" width="100" height="5" rx="2" fill="rgba(255,255,255,0.3)" />
        <rect x="22" y="48" width="80" height="5" rx="2" fill="rgba(255,255,255,0.2)" />
        <rect x="22" y="66" width="74" height="44" rx="6" fill={GREEN} opacity="0.8" />
        <polygon points="50,80 50,98 66,89" fill={INK} />
        <rect x="106" y="66" width="74" height="20" rx="4" fill="rgba(255,255,255,0.08)" />
        <rect x="106" y="90" width="74" height="20" rx="4" fill="rgba(255,255,255,0.08)" />
        <rect x="-12" y="130" width="224" height="8" rx="3" fill={INK} />
      </g>

      {/* tablet */}
      <g transform="translate(230 50)">
        <rect x="0" y="0" width="80" height="110" rx="8" fill={INK} />
        <rect x="6" y="8" width="68" height="94" rx="4" fill={CARD} />
        <rect x="14" y="18" width="36" height="6" rx="2" fill={GREEN} />
        <rect x="14" y="28" width="50" height="4" rx="2" fill="rgba(255,255,255,0.25)" />
        <rect x="14" y="40" width="50" height="36" rx="4" fill={GREEN} opacity="0.75" />
        <polygon points="32,50 32,66 46,58" fill={INK} />
        <rect x="14" y="82" width="50" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="14" y="90" width="32" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      </g>

      {/* phone */}
      <g transform="translate(190 130)">
        <rect x="0" y="0" width="56" height="100" rx="10" fill={INK} />
        <rect x="4" y="8" width="48" height="84" rx="6" fill={CARD} />
        <rect x="10" y="14" width="24" height="4" rx="2" fill={GREEN} />
        <rect x="10" y="22" width="36" height="3" rx="1" fill="rgba(255,255,255,0.2)" />
        <circle cx="28" cy="48" r="12" fill={GREEN} />
        <polygon points="24,42 24,54 34,48" fill={INK} />
        <rect x="10" y="68" width="36" height="3" rx="1" fill="rgba(255,255,255,0.18)" />
        <rect x="10" y="76" width="24" height="3" rx="1" fill="rgba(255,255,255,0.12)" />
      </g>

      {/* accent shapes */}
      <g fill={GREEN}>
        <path d="M20 20 l10 -10 l10 10 l-10 10 z" opacity="0.9" />
        <path d="M320 230 l10 -10 l10 10 l-10 10 z" opacity="0.9" />
        <circle cx="310" cy="180" r="5" />
      </g>
    </svg>
  );
}

export function ResellPhoneIllustration({ tone = "dark", ...rest }: BaseProps) {
  return (
    <svg
      viewBox="0 0 360 290"
      role="img"
      aria-label="Phone showing a resell access listing on Sniser Marketplace"
      {...rest}
    >
      <rect x="0" y="0" width="360" height="290" fill={surfaceFor(tone)} />

      {/* halo */}
      <circle cx="160" cy="150" r="100" fill={GREEN} opacity="0.1" />

      {/* phone */}
      <g transform="translate(100 30)">
        <rect x="0" y="0" width="120" height="220" rx="20" fill={INK} stroke={GREEN} strokeOpacity="0.35" />
        <rect x="6" y="10" width="108" height="200" rx="14" fill={CARD} />

        <rect x="18" y="24" width="60" height="8" rx="3" fill={GREEN} />
        <rect x="18" y="38" width="80" height="5" rx="2" fill="rgba(255,255,255,0.3)" />

        <rect x="18" y="58" width="84" height="48" rx="8" fill="rgba(255,255,255,0.08)" />
        <rect x="26" y="68" width="34" height="34" rx="6" fill={GREEN} />
        <rect x="66" y="70" width="32" height="6" rx="2" fill="rgba(255,255,255,0.8)" />
        <rect x="66" y="80" width="24" height="5" rx="2" fill="rgba(255,255,255,0.4)" />
        <rect x="66" y="94" width="32" height="6" rx="2" fill={GREEN} />

        <rect x="18" y="116" width="84" height="36" rx="8" fill={GREEN} />
        <rect x="40" y="128" width="40" height="6" rx="2" fill={INK} />
        <rect x="34" y="140" width="52" height="4" rx="2" fill={INK} opacity="0.7" />

        <rect x="18" y="162" width="84" height="32" rx="8" fill="rgba(255,255,255,0.06)" />
        <rect x="32" y="172" width="56" height="5" rx="2" fill="rgba(255,255,255,0.7)" />
        <rect x="32" y="182" width="42" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
      </g>

      {/* coin */}
      <g transform="translate(240 130)">
        <circle cx="40" cy="40" r="40" fill={GREEN} />
        <circle cx="40" cy="40" r="32" fill={GREEN_DARK} />
        <text
          x="40"
          y="50"
          textAnchor="middle"
          fontSize="32"
          fontWeight="900"
          fill={INK}
          fontFamily="Inter, system-ui, sans-serif"
        >
          $
        </text>
      </g>
      <g transform="translate(265 195)" opacity="0.8">
        <circle cx="20" cy="20" r="20" fill={GREEN_DARK} />
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fontSize="16"
          fontWeight="900"
          fill={INK}
          fontFamily="Inter, system-ui, sans-serif"
        >
          $
        </text>
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Artist-page illustrations
// ────────────────────────────────────────────────────────────────────────────

export function ArtistHeroIllustration({ tone: _tone, ...rest }: BaseProps) {
  return (
    <svg
      viewBox="0 0 400 480"
      role="img"
      aria-label="Recording artist with headphones at a studio microphone"
      {...rest}
    >
      {/* circular spotlight */}
      <circle cx="200" cy="240" r="200" fill={INK} opacity="0.06" />
      <circle cx="200" cy="240" r="160" fill={INK} opacity="0.05" />

      {/* mic stand */}
      <rect x="195" y="280" width="10" height="180" rx="3" fill={INK} />
      <rect x="160" y="455" width="80" height="8" rx="3" fill={INK} />

      {/* mic body */}
      <g transform="translate(140 180)">
        <rect x="40" y="0" width="40" height="100" rx="20" fill={INK} />
        <rect x="46" y="10" width="28" height="80" rx="14" fill={GREEN} opacity="0.85" />
        {/* grill lines */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={i}
            x1="46"
            x2="74"
            y1={20 + i * 12}
            y2={20 + i * 12}
            stroke={INK}
            strokeWidth="2"
            opacity="0.6"
          />
        ))}
      </g>

      {/* artist silhouette */}
      <g transform="translate(70 60)">
        {/* hoodie / body */}
        <path
          d="M50 200 Q50 110 130 110 Q210 110 210 200 L210 320 L50 320 Z"
          fill={INK}
        />
        {/* face */}
        <circle cx="130" cy="90" r="58" fill="#8C5A3A" />
        {/* hair top */}
        <path d="M76 70 Q90 30 130 30 Q170 30 184 70 Q170 60 130 60 Q90 60 76 70" fill={INK} />
        {/* beard */}
        <path d="M90 110 Q130 150 170 110 Q170 138 130 142 Q90 138 90 110" fill={INK} opacity="0.85" />
        {/* headphones */}
        <path
          d="M68 80 Q68 24 130 24 Q192 24 192 80"
          fill="none"
          stroke={GREEN}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <rect x="60" y="70" width="20" height="36" rx="6" fill={GREEN} />
        <rect x="180" y="70" width="20" height="36" rx="6" fill={GREEN} />
        {/* glasses */}
        <circle cx="110" cy="90" r="14" fill="none" stroke={INK} strokeWidth="4" />
        <circle cx="150" cy="90" r="14" fill="none" stroke={INK} strokeWidth="4" />
        <line x1="124" y1="90" x2="136" y2="90" stroke={INK} strokeWidth="3" />
        {/* hand on mic */}
        <ellipse cx="170" cy="220" rx="22" ry="14" fill="#8C5A3A" transform="rotate(-20 170 220)" />
      </g>
    </svg>
  );
}

export function ContactSniserIllustration({ tone = "dark", ...rest }: BaseProps) {
  return (
    <svg viewBox="0 0 360 270" role="img" aria-label="Sniser team reviewing artist submissions" {...rest}>
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* table */}
      <rect x="40" y="180" width="280" height="14" rx="3" fill={GREEN} opacity="0.3" />
      <rect x="60" y="194" width="240" height="6" rx="3" fill={GREEN} opacity="0.2" />

      {/* laptop */}
      <g transform="translate(150 130)">
        <rect x="0" y="0" width="60" height="40" rx="3" fill={INK} />
        <rect x="3" y="3" width="54" height="34" rx="2" fill={CARD} />
        <rect x="-8" y="40" width="76" height="4" rx="2" fill={INK} />
      </g>

      {/* person left */}
      <g transform="translate(60 80)">
        <circle cx="30" cy="30" r="20" fill="#D4A37A" />
        <path d="M10 80 Q10 50 30 50 Q50 50 50 80 L50 110 L10 110 Z" fill={GREEN} />
        <path d="M14 30 Q14 16 30 16 Q46 16 46 30 Q46 24 30 24 Q14 24 14 30" fill={INK} />
      </g>

      {/* person right */}
      <g transform="translate(250 80)">
        <circle cx="30" cy="30" r="20" fill="#8C5A3A" />
        <path d="M10 80 Q10 50 30 50 Q50 50 50 80 L50 110 L10 110 Z" fill={INK} />
        <path d="M14 30 Q14 14 30 14 Q46 14 46 30 Q46 22 30 22 Q14 22 14 30" fill={INK} />
      </g>

      {/* speech bubble */}
      <g transform="translate(150 30)">
        <rect x="0" y="0" width="80" height="44" rx="10" fill={GREEN} />
        <polygon points="20,44 30,44 26,54" fill={GREEN} />
        <rect x="10" y="12" width="50" height="6" rx="2" fill={INK} />
        <rect x="10" y="24" width="38" height="5" rx="2" fill={INK} opacity="0.7" />
      </g>

      {/* sparkles */}
      <g fill={GREEN}>
        <path d="M30 30 l6 -6 l6 6 l-6 6 z" />
        <path d="M310 220 l8 -8 l8 8 l-8 8 z" />
      </g>
    </svg>
  );
}

export function AgreementIllustration({ tone = "green", ...rest }: BaseProps) {
  return (
    <svg viewBox="0 0 360 270" role="img" aria-label="Signing an exclusive content agreement" {...rest}>
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* paper */}
      <g transform="translate(80 50)">
        <rect x="0" y="0" width="140" height="170" rx="6" fill={WHITE} />
        <rect x="14" y="20" width="80" height="8" rx="3" fill={INK} />
        <rect x="14" y="36" width="112" height="4" rx="2" fill={INK} opacity="0.6" />
        <rect x="14" y="46" width="100" height="4" rx="2" fill={INK} opacity="0.5" />
        <rect x="14" y="56" width="112" height="4" rx="2" fill={INK} opacity="0.5" />
        <rect x="14" y="72" width="60" height="4" rx="2" fill={INK} opacity="0.4" />

        {/* signature line */}
        <line x1="14" y1="120" x2="100" y2="120" stroke={INK} strokeOpacity="0.4" strokeWidth="2" />
        <path
          d="M16 116 Q30 100 40 116 T70 116 T100 110"
          fill="none"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* stamp */}
        <circle cx="110" cy="146" r="16" fill="none" stroke={INK} strokeWidth="2" />
        <text
          x="110"
          y="151"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill={INK}
          fontFamily="Inter, system-ui, sans-serif"
        >
          OK
        </text>
      </g>

      {/* pen */}
      <g transform="translate(180 100) rotate(40)">
        <rect x="0" y="0" width="120" height="10" rx="3" fill={INK} />
        <polygon points="120,0 140,5 120,10" fill={GREEN_DARK} />
        <rect x="0" y="0" width="20" height="10" rx="3" fill={GREEN} />
      </g>

      {/* sparkles */}
      <g fill={INK}>
        <path d="M40 200 l8 -8 l8 8 l-8 8 z" opacity="0.5" />
        <circle cx="320" cy="60" r="4" opacity="0.6" />
      </g>
    </svg>
  );
}

export function StudioIllustration({ tone = "light", ...rest }: BaseProps) {
  return (
    <svg viewBox="0 0 360 270" role="img" aria-label="Studio production with headphones and music notes" {...rest}>
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* headphones */}
      <g transform="translate(100 60)">
        <path
          d="M20 90 Q20 0 100 0 Q180 0 180 90"
          fill="none"
          stroke={INK}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <rect x="0" y="80" width="40" height="70" rx="14" fill={INK} />
        <rect x="160" y="80" width="40" height="70" rx="14" fill={INK} />
        <rect x="6" y="86" width="28" height="58" rx="10" fill={GREEN} />
        <rect x="166" y="86" width="28" height="58" rx="10" fill={GREEN} />

        {/* cable to jack */}
        <path
          d="M20 150 Q10 180 50 200"
          fill="none"
          stroke={INK}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="48" y="196" width="10" height="14" rx="2" fill={INK} />
      </g>

      {/* music notes */}
      <g fill={GREEN_DARK} stroke={INK} strokeWidth="2">
        <g transform="translate(40 80)">
          <circle cx="0" cy="20" r="8" />
          <line x1="8" y1="20" x2="8" y2="-10" stroke={INK} strokeWidth="3" />
        </g>
        <g transform="translate(290 110)">
          <circle cx="0" cy="20" r="8" />
          <line x1="8" y1="20" x2="8" y2="-14" stroke={INK} strokeWidth="3" />
          <line x1="8" y1="-14" x2="22" y2="-8" stroke={INK} strokeWidth="3" />
        </g>
      </g>

      {/* sparkles */}
      <g fill={GREEN}>
        <path d="M30 30 l8 -8 l8 8 l-8 8 z" />
        <circle cx="320" cy="220" r="4" />
      </g>
    </svg>
  );
}

export function ReleaseIllustration({ tone = "dark", ...rest }: BaseProps) {
  return (
    <svg viewBox="0 0 360 270" role="img" aria-label="Exclusive album release going live on the platform" {...rest}>
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* center album disc */}
      <g transform="translate(180 135)">
        <circle r="60" fill={INK} stroke={GREEN} strokeWidth="3" />
        <circle r="40" fill={CARD} />
        <circle r="20" fill={GREEN} />
        <circle r="6" fill={INK} />
      </g>

      {/* satellite social icons */}
      <g transform="translate(70 60)">
        <circle r="22" fill={GREEN} />
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fontSize="20"
          fontWeight="900"
          fill={INK}
          fontFamily="Inter, system-ui, sans-serif"
        >
          ♪
        </text>
      </g>
      <g transform="translate(290 70)">
        <circle r="22" fill={GREEN} />
        <polygon points="-8,-8 -8,8 10,0" fill={INK} />
      </g>
      <g transform="translate(60 200)">
        <circle r="22" fill={GREEN} />
        <rect x="-8" y="-8" width="16" height="16" rx="4" fill={INK} />
      </g>
      <g transform="translate(300 210)">
        <circle r="22" fill={GREEN} />
        <path d="M -8 -2 L 8 -2 L 0 10 Z" fill={INK} />
      </g>

      {/* lines connecting to center */}
      <g stroke={GREEN} strokeWidth="2" strokeDasharray="3 4" opacity="0.5" fill="none">
        <line x1="86" y1="70" x2="150" y2="120" />
        <line x1="276" y1="80" x2="216" y2="120" />
        <line x1="80" y1="190" x2="150" y2="150" />
        <line x1="280" y1="200" x2="216" y2="150" />
      </g>
    </svg>
  );
}

export function RevenueIllustration({ tone = "green", ...rest }: BaseProps) {
  return (
    <svg viewBox="0 0 360 270" role="img" aria-label="Artist reviewing revenue dashboard" {...rest}>
      <rect x="0" y="0" width="360" height="270" fill={surfaceFor(tone)} />

      {/* desk */}
      <rect x="40" y="200" width="280" height="6" rx="2" fill={INK} opacity="0.7" />

      {/* monitor */}
      <g transform="translate(110 50)">
        <rect x="0" y="0" width="180" height="120" rx="8" fill={INK} />
        <rect x="6" y="6" width="168" height="108" rx="6" fill={CARD} />

        {/* chart bars */}
        <rect x="22" y="80" width="14" height="22" rx="2" fill={GREEN} />
        <rect x="44" y="60" width="14" height="42" rx="2" fill={GREEN} />
        <rect x="66" y="48" width="14" height="54" rx="2" fill={GREEN} />
        <rect x="88" y="34" width="14" height="68" rx="2" fill={GREEN} />
        <rect x="110" y="22" width="14" height="80" rx="2" fill={GREEN} />

        {/* trend line */}
        <polyline
          points="22,86 44,68 66,56 88,42 110,30 132,18"
          fill="none"
          stroke={WHITE}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* stat label */}
        <rect x="140" y="20" width="30" height="6" rx="2" fill={GREEN} />
        <rect x="140" y="30" width="22" height="4" rx="2" fill="rgba(255,255,255,0.5)" />

        {/* stand */}
        <rect x="80" y="120" width="20" height="10" fill={INK} />
        <rect x="60" y="128" width="60" height="6" rx="2" fill={INK} />
      </g>

      {/* coins */}
      <g transform="translate(60 130)">
        <circle r="22" fill={GREEN_DARK} />
        <text
          y="6"
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fill={INK}
          fontFamily="Inter, system-ui, sans-serif"
        >
          $
        </text>
      </g>
      <g transform="translate(305 160)">
        <circle r="18" fill={GREEN_DARK} />
        <text
          y="5"
          textAnchor="middle"
          fontSize="14"
          fontWeight="900"
          fill={INK}
          fontFamily="Inter, system-ui, sans-serif"
        >
          $
        </text>
      </g>
    </svg>
  );
}

export function NetworkIllustration({ tone = "dark", ...rest }: BaseProps) {
  return (
    <svg viewBox="0 0 320 320" role="img" aria-label="Tap into the Sniser network" {...rest}>
      <rect x="0" y="0" width="320" height="320" fill={surfaceFor(tone)} />

      {/* phone */}
      <g transform="translate(80 40)">
        <rect x="0" y="0" width="160" height="240" rx="22" fill={INK} stroke={GREEN} strokeOpacity="0.4" />
        <rect x="8" y="12" width="144" height="216" rx="14" fill={CARD} />

        {/* avatars in a list */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(20 ${30 + i * 56})`}>
            <circle cx="20" cy="20" r="16" fill={GREEN} opacity={1 - i * 0.18} />
            <rect x="46" y="10" width="68" height="6" rx="2" fill="rgba(255,255,255,0.85)" />
            <rect x="46" y="22" width="50" height="5" rx="2" fill="rgba(255,255,255,0.4)" />
            <rect x="46" y="30" width="38" height="5" rx="2" fill="rgba(255,255,255,0.3)" />
          </g>
        ))}
      </g>

      {/* connecting nodes */}
      <g fill={GREEN}>
        <circle cx="40" cy="60" r="6" />
        <circle cx="280" cy="80" r="8" />
        <circle cx="60" cy="270" r="7" />
        <circle cx="290" cy="240" r="6" />
      </g>
      <g stroke={GREEN} strokeWidth="2" strokeDasharray="3 4" opacity="0.45" fill="none">
        <line x1="46" y1="60" x2="80" y2="80" />
        <line x1="272" y1="80" x2="240" y2="100" />
        <line x1="66" y1="270" x2="92" y2="240" />
        <line x1="282" y1="240" x2="250" y2="220" />
      </g>
    </svg>
  );
}
