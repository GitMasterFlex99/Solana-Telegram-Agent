const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TWITTER_HANDLE = /^[A-Za-z0-9_]{1,15}$/;

export function isSolanaAddress(value: string): boolean {
  return SOLANA_ADDRESS.test(value.trim());
}

export function isTwitterHandle(value: string): boolean {
  return TWITTER_HANDLE.test(value.trim().replace(/^@/, ""));
}

export function safeCallbackId(value: string, prefix: string): string | null {
  const expected = `${prefix}:`;
  if (!value.startsWith(expected)) return null;
  const payload = value.slice(expected.length);
  if (!payload || payload.length > 128) return null;
  return payload;
}
