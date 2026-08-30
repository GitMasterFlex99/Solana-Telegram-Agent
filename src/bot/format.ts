export function money(value?: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value! >= 1e6) return `$${(value! / 1e6).toFixed(1)}M`;
  if (value! >= 1e3) return `$${(value! / 1e3).toFixed(1)}K`;
  return `$${value!.toFixed(0)}`;
}

export function age(timestamp?: number, now = Date.now()): string {
  if (!timestamp) return "unknown";
  const hours = Math.max(0, (now - timestamp) / 3_600_000);
  return hours < 24 ? `${hours.toFixed(0)}h` : `${(hours / 24).toFixed(1)}d`;
}
