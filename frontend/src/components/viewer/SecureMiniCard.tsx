import { ShieldIcon, CheckIcon } from "../shared/Icons";

const POINTS = ["Secure", "Transparent", "Built on Blockchain"] as const;

/**
 * Small companion card rendered beside the phone illustration in the
 * "We verify your access" step. Mirrors the trust badge from the Figma.
 */
export default function SecureMiniCard() {
  return (
    <div className="rounded-2xl bg-bg-soft/80 ring-1 ring-white/10 p-5 text-white shadow-card backdrop-blur transition-all duration-300 ease-out-soft hover:ring-white/20">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-green/15 text-brand-green mb-4">
        <ShieldIcon className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold tracking-widestPlus uppercase text-white/90">
        Secure
      </p>
      <ul className="mt-3 space-y-2">
        {POINTS.map((label) => (
          <li key={label} className="flex items-start gap-2 text-xs text-white/75">
            <CheckIcon
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-green"
              aria-hidden="true"
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
