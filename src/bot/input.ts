export function normalizeText(value: string): string {
  return value.trim();
}

export function isPotentialOpenAIKey(value: string): boolean {
  const key = normalizeText(value);
  return /^sk-[A-Za-z0-9_-]{16,}$/.test(key);
}

export function isPotentialTwitterInput(value: string): boolean {
  const input = normalizeText(value);
  return /^@?[A-Za-z0-9_]{1,15}$/.test(input) || /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]{1,15}\/?$/i.test(input);
}
