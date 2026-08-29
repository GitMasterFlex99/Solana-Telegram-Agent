import type { ScannerResult } from "./scanner.js";

export type CandidateClass = "interesting" | "momentum" | "caution" | "weak";

export type CandidateResult = ScannerResult & {
  classification: CandidateClass;
  reasons: string[];
};

export function classifyCandidate(result: ScannerResult): CandidateResult {
  const reasons: string[] = [];
  let classification: CandidateClass = "weak";

  if (result.opportunityScore >= 75 && result.momentum.score >= 65) {
    classification = "interesting";
    reasons.push("Strong opportunity and momentum");
  } else if (result.momentum.score >= 70) {
    classification = "momentum";
    reasons.push("Momentum is the dominant signal");
  } else if (result.opportunityScore >= 55) {
    classification = "caution";
    reasons.push("Worth monitoring, but signals are not strong enough for a top candidate");
  } else {
    reasons.push("Weak opportunity signal");
  }

  if (result.momentum.flags.length) reasons.push(...result.momentum.flags.slice(0, 2));
  return { ...result, classification, reasons };
}
