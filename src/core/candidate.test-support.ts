import type { CandidateClass, CandidateResult } from "./candidate.js";

export const candidateLabel = (classification: CandidateClass): string => {
  switch (classification) {
    case "interesting": return "Interesting";
    case "momentum": return "Momentum";
    case "caution": return "Caution";
    default: return "Weak";
  }
};

export const riskCompatibility = (candidate: CandidateResult, riskScore: number): "review" | "avoid" | "candidate" => {
  if (riskScore < 45) return "avoid";
  if (candidate.classification === "interesting" && riskScore >= 70) return "candidate";
  return "review";
};
