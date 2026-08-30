export type SocialMention = {
  account: string;
  tokenAddress: string;
  ageMinutes: number;
  hasEvidence: boolean;
  priceChangeBeforeMentionPct?: number;
};

export type SocialAssessment = {
  score: number;
  label: "weak" | "mixed" | "interesting";
  reasons: string[];
};

export function assessSocial(mentions: SocialMention[]): SocialAssessment {
  if (!mentions.length) return { score: 0, label: "weak", reasons: ["No tracked social mentions"] };
  const unique = new Set(mentions.map(m => m.account)).size;
  const early = mentions.filter(m => m.ageMinutes <= 30).length;
  const evidence = mentions.filter(m => m.hasEvidence).length;
  const late = mentions.filter(m => (m.priceChangeBeforeMentionPct ?? 0) >= 30).length;
  let score = Math.min(45, unique * 15) + Math.min(30, early * 10) + Math.min(25, evidence * 8) - Math.min(30, late * 10);
  score = Math.max(0, Math.min(100, score));
  const reasons: string[] = [];
  if (unique >= 2) reasons.push("Multiple independent accounts");
  else reasons.push("Only one tracked account");
  if (early > 0) reasons.push("Early mentions");
  if (evidence > 0) reasons.push("Some mentions include evidence");
  if (late > 0) reasons.push("Some mentions came after a large move");
  return { score, label: score >= 60 ? "interesting" : score >= 35 ? "mixed" : "weak", reasons };
}
