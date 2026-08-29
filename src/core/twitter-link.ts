export type TwitterAccount = { handle: string; url: string };

export function parseTwitterAccount(input: string): TwitterAccount | null {
  const value = input.trim().replace(/^@/, "");
  const match = value.match(/^(?:https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/)?([A-Za-z0-9_]{1,15})\/?$/i);
  if (!match) return null;
  const handle = match[1];
  return { handle, url: `https://x.com/${handle}` };
}

export function formatTwitterAccount(account: TwitterAccount): string {
  return `@${account.handle} — ${account.url}`;
}
