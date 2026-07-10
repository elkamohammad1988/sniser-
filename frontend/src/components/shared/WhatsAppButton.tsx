import { ArrowUpRight, WhatsAppIcon } from "./Icons";
import { cn } from "../../utils/cn";
import { env } from "../../config/env";

interface Props {
  className?: string;
}

const LABEL = "Message us on WhatsApp";
const SUB_LABEL = "for more information";

export default function WhatsAppButton({ className }: Props) {
  return (
    <a
      href={env.whatsappUrl}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${LABEL} — opens WhatsApp in a new tab`}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full pl-1 pr-5 py-1.5",
        "bg-bg-card/80 ring-1 ring-white/10 text-white",
        "transition-all duration-200 ease-out-soft",
        "hover:-translate-y-0.5 hover:bg-bg-soft hover:ring-white/20 hover:shadow-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg focus-visible:ring-offset-2 focus-visible:ring-offset-brand-green",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-10 w-10 place-items-center rounded-full bg-brand-green text-bg transition-shadow duration-300 group-hover:shadow-glow"
      >
        <WhatsAppIcon className="h-5 w-5" />
      </span>
      <span className="flex flex-col text-left leading-tight">
        <span className="text-sm font-semibold">{LABEL}</span>
        <span className="text-[11px] opacity-60">{SUB_LABEL}</span>
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-4 w-4 opacity-70 transition-transform duration-200 ease-out-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </a>
  );
}
