import { cn } from "../../utils/cn";

interface Props {
  className?: string;
}

export default function Logo({ className }: Props) {
  return (
    <div className={cn("group flex items-center gap-2", className)}>
      <span
        className="grid h-8 w-8 place-items-center rounded-md bg-brand-green text-bg font-extrabold transition-transform duration-300 ease-out-soft group-hover:rotate-[-6deg]"
        aria-hidden="true"
      >
        S
      </span>
      <span className="text-lg font-extrabold tracking-wide text-white">
        SNISER
      </span>
    </div>
  );
}
