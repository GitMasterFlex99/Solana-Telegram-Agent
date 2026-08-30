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
  promotionalMentions: number;
  credibleAccounts: number;
  summary: string;
};

const unique = (values: string[]) => new Set(values.filter(Boolean)).size;

export function socialSignal(mentions: SocialMention[], now = Date.now()): SocialSignal {
  const normalized = mentions
    .map(m => ({ ...m, account: m.account.trim().toLowerCase(), text: m.text?.trim().toLowerCase() }))
    .filter(m => m.account.length > 0);

  const uniqueAccounts = unique(normalized.map(m => m.account));
  const early = normalized.filter(m => now - m.mentionedAt >= 0 && now - m.mentionedAt <= 60 * 60_000).length;
  const evidence = normalized.filter(m => m.hasEvidence).length;
  const late = normalized.filter(m => m.priceAtMention !== undefined && m.priceAfter !== undefined && m.priceAfter > m.priceAtMention * 1.25).length;
  const distinctTexts = unique(normalized.map(m => m.text ?? ""));
  const repeatedPosts = normalized.length >= 3 && distinctTexts / normalized.length < 0.5;
  const credibleAccounts = unique(normalized.filter(m => m.verified || (m.followers ?? 0) >= 10_000).map(m => m.account));
  const promotionalMentions = normalized.filter(m => /(?:buy|ape|100x|1000x|moon|gem|send it|don't miss|presale|calls?)/i.test(m.text ?? "")).length;
  const promotionalRate = normalized.length ? promotionalMentions / normalized.length : 0;

  let score = 0;
  score += Math.min(35, uniqueAccounts * 12);
  score += Math.min(25, early * 8);
  score += Math.min(20, evidence * 10);
  score += Math.min(10, credibleAccounts * 5);
  score -= Math.min(20, late * 10);
  score -= Math.min(20, Math.round(promotionalRate * 20));
  if (repeatedPosts) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const summary = uniqueAccounts === 0
    ? "No tracked social signal"
    : promotionalRate >= 0.6 || repeatedPosts && evidence === 0
      ? "Mostly promotional or repeated mentions"
      : late > 0 && evidence === 0
        ? "Mostly late/hype-style mentions"
        : uniqueAccounts >= 2 && early > 0 && evidence > 0
          ? "Multiple independent early mentions with evidence"
          : uniqueAccounts >= 2 && early > 0
            ? "Multiple independent early mentions"
            : "Limited social signal";

  return {
    score,
    mentions: normalized.length,
    independentAccounts: uniqueAccounts,
    earlyMentions: early,
    evidenceMentions: evidence,
    lateMentions: late,
    promotionalMentions,
    credibleAccounts,
    summary,
  };
}
