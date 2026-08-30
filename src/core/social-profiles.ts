export type SocialProfile = {
  handle: string;
  weight: number;
  notes?: string;
  addedAt: number;
};

export function normalizeHandle(input: string): string | null {
  const value = input.trim().replace(/^@/, "").replace(/\/$/, "");
  if (!/^[A-Za-z0-9_]{1,15}$/.test(value)) return null;
  return value.toLowerCase();
}

export function socialProfileScore(profiles: SocialProfile[], mentionedHandles: string[]): number {
  if (!mentionedHandles.length || !profiles.length) return 0;
  const weights = new Map(profiles.map(p => [p.handle.toLowerCase(), Math.max(0, Math.min(2, p.weight))]));
  const unique = [...new Set(mentionedHandles.map(normalizeHandle).filter((x): x is string => Boolean(x)))];
  return Math.min(100, Math.round(unique.reduce((sum, handle) => sum + (weights.get(handle) ?? 0.25) * 25, 0)));
}
