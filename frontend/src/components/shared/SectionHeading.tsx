import { ReactNode } from "react";
import { cn } from "../../utils/cn";
import AnimateIn from "./AnimateIn";

interface Props {
  eyebrow?: string;
  children: ReactNode;
  /** A trailing word/phrase rendered in brand green. */
  highlight?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  children,
  highlight,
  align = "center",
  className,
}: Props) {
  return (
    <AnimateIn
      className={cn(align === "center" ? "text-center" : "text-left", className)}
    >
      {eyebrow && (
        <p className="text-xs font-semibold tracking-widestPlus uppercase mb-3 text-white/55">
          {eyebrow}
        </p>
      )}
      <h2 className="text-display font-extrabold leading-tight text-white">
        {children}
        {highlight && (
          <>
            {" "}
            <span className="text-brand-green">{highlight}</span>
          </>
        )}
      </h2>
      <span
        aria-hidden="true"
        className={cn(
          "inline-block mt-3 h-1 w-12 rounded-full bg-brand-green",
          align === "center" && "mx-auto"
        )}
      />
    </AnimateIn>
  );
}
