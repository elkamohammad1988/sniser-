import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Centered, padded width container — the single source of horizontal rhythm. */
export default function Container({ className, children, ...rest }: Props) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
