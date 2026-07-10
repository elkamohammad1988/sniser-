/**
 * Lightweight className combiner. No deps, no clsx — just join truthy strings.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
