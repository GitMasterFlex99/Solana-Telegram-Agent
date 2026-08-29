import { scoreXPosts, type XPost, type XSignal } from "./x-signals.js";
import type { CandidateResult } from "./candidate.js";

export type IntelligenceResult = { score: number; x: XSignal; reasons: string[] };

export function assessIntelligence(candidate: CandidateResult, xPosts: XPost[], now = Date.now()): IntelligenceResult {
  const x = scoreXPosts(xPosts, now);
  const score = Math.round(candidate.opportunityScore * 0.45 + candidate.momentum.score * 0.30 + x.score * 0.25);
  const reasons = [...candidate.reasons.slice(0, 2), ...x.reasons];
  return { score: Math.max(0, Math.min(100, score)), x, reasons };
}

export function rankIntelligence<T extends CandidateResult>(items: Array<{ candidate: T; xPosts: XPost[] }>, now = Date.now()) {
  return items.map(item => ({ ...item, intelligence: assessIntelligence(item.candidate, item.xPosts, now) })).sort((a,b) => b.intelligence.score - a.intelligence.score);
}
