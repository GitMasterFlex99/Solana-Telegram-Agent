export type SocialMention = {
  account: string;
  mentionedAt: number;
  priceAtMention?: number;
  priceAfter?: number;
  hasEvidence?: boolean;
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
  const uniqueAccounts = new Set(mentions.map(m => m.account.toLowerCase())).size;
  const early = mentions.filter(m => now - m.mentionedAt <= 60 * 60_000).length;
  const evidence = mentions.filter(m => m.hasEvidence).length;
  const late = mentions.filter(m => m.priceAtMention !== undefined && m.priceAfter !== undefined && m.priceAfter > m.priceAtMention * 1.25).length;

  let score = 0;
  score += Math.min(35, uniqueAccounts * 12);
  score += Math.min(25, early * 8);
  score += Math.min(20, evidence * 10);
  score -= Math.min(20, late * 10);
  score = Math.max(0, Math.min(100, score));

  const summary = uniqueAccounts === 0
    ? "No tracked social signal"
    : late > 0 && evidence === 0
      ? "Mostly late/hype-style mentions"
      : uniqueAccounts >= 2 && early > 0
        ? "Multiple independent early mentions"
        : "Limited social signal";

  return { score, mentions: mentions.length, independentAccounts: uniqueAccounts, earlyMentions: early, evidenceMentions: evidence, lateMentions: late, summary };
}
