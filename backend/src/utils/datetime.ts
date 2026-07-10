export function nowIso(): string {
  return new Date().toISOString();
}

export function addDays(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function addMinutes(minutes: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + minutes * 60_000);
}

export function isPast(iso: string): boolean {
  const t = Date.parse(iso);
  return Number.isFinite(t) && t < Date.now();
}
