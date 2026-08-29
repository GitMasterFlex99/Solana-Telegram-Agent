export type SocialMention = {
  account: string;
  tokenAddress: string;
  timestamp: number;
  hasEvidence: boolean;
  engagement?: number;
  historicalReliability?: number;
};

export type SocialAssessment = {
  score: number;
  label: "Weak" | "Mixed" | "Strong";
  flags: string[];
};

/**
 * Social data is treated as a supporting signal only. A mention never becomes
 * a buy recommendation by itself.
 */
export function assessSocial(mentions: SocialMention[]): SocialAssessment {
  const flags: string[] = [];
  if (!mentions.length) return { score: 0, label: "Weak", flags: ["No tracked mentions"] };

  const accounts = new Set(mentions.map(m => m.account.toLowerCase()));
  const evidence = mentions.filter(m => m.hasEvidence).length;
  const reliable = mentions.filter(m => (m.historicalReliability ?? 0) >= 0.65).length;
  let score = Math.min(35, accounts.size * 7) + Math.min(30, evidence * 10) + Math.min(35, reliable * 12);

  if (accounts.size < 2) flags.push("Single-account signal");
  if (evidence === 0) flags.push("No independently verifiable evidence");
  if (reliable === 0) flags.push("No tracked high-reliability accounts");

  score = Math.max(0, Math.min(100, score));
  return { score, label: score >= 70 ? "Strong" : score >= 40 ? "Mixed" : "Weak", flags };
}
