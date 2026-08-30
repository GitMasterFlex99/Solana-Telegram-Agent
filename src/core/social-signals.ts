export type SocialMention = {
  account: string;
  mentionedAt: number;
  priceAtMention?: number;
  priceAfter?: number;
  hasEvidence?: boolean;
  followers?: number;
  verified?: boolean;
  text?: string;
};

export type SocialSignal = {
  score: number;
  mentions: number;
  independentAccounts: number;
  earlyMentions: number;
  evidenceMentions: number;
  lateMentions: number;
  summary: string;
};

export function socialSignal(mentions: SocialMention[], now = Date.now()): SocialSignal {
  const normalized = mentions.map(m => ({ ...m, account: m.account.trim().toLowerCase() }));
  const uniqueAccounts = new Set(normalized.map(m => m.account)).size;
  const early = normalized.filter(m => now - m.mentionedAt <= 60 * 60_000).length;
  const evidence = normalized.filter(m => m.hasEvidence).length;
  const late = normalized.filter(m => m.priceAtMention !== undefined && m.priceAfter !== undefined && m.priceAfter > m.priceAtMention * 1.25).length;
  const distinctTexts = new Set(normalized.map(m => m.text?.trim().toLowerCase()).filter(Boolean)).size;
  const repeatedPosts = normalized.length >= 3 && distinctTexts > 0 && distinctTexts / normalized.length < 0.5;
  const credibleAccounts = new Set(normalized.filter(m => (m.verified || (m.followers ?? 0) >= 10_000)).map(m => m.account)).size;

  let score = 0;
  score += Math.min(35, uniqueAccounts * 12);
  score += Math.min(25, early * 8);
  score += Math.min(20, evidence * 10);
  score += Math.min(10, credibleAccounts * 5);
  score -= Math.min(20, late * 10);
  if (repeatedPosts) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const summary = uniqueAccounts === 0
    ? "No tracked social signal"
    : repeatedPosts && evidence === 0
      ? "Repeated promotional mentions"
      : late > 0 && evidence === 0
        ? "Mostly late/hype-style mentions"
        : uniqueAccounts >= 2 && early > 0 && evidence > 0
          ? "Multiple independent early mentions with evidence"
          : uniqueAccounts >= 2 && early > 0
            ? "Multiple independent early mentions"
            : "Limited social signal";

  return { score, mentions: mentions.length, independentAccounts: uniqueAccounts, earlyMentions: early, evidenceMentions: evidence, lateMentions: late, summary };
}
