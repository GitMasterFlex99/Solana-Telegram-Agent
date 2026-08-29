import type { CandidateResult } from "./candidate.js";

export type SafetyGate = {
  decision: "candidate" | "review" | "avoid";
  blocked: boolean;
  reasons: string[];
};

export function applySafetyGate(candidate: CandidateResult, riskScore: number, hardWarnings: string[]): SafetyGate {
  const reasons = [...hardWarnings];
  if (hardWarnings.length > 0 || riskScore < 45) {
    if (riskScore < 45) reasons.push("Combined risk score is below the minimum safety threshold");
    return { decision: "avoid", blocked: true, reasons: [...new Set(reasons)] };
  }
  if (candidate.classification === "interesting" && riskScore >= 70) {
    return { decision: "candidate", blocked: false, reasons: ["Opportunity and safety thresholds both passed"] };
  }
  return { decision: "review", blocked: false, reasons: ["Candidate requires manual review before any action"] };
}
