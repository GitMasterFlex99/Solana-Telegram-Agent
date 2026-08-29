import { describe, expect, it } from "vitest";
import { candidateLabel, riskCompatibility } from "../src/core/candidate.test-support.js";
import type { CandidateResult } from "../src/core/candidate.js";

const candidate = (classification: CandidateResult["classification"]): CandidateResult => ({
  chainId: "solana", baseToken: { address: "mint" }, opportunityScore: 80,
  momentum: { score: 80, flags: [], volumeChangePct: null, liquidityChangePct: null, buyPressure: 0.5 },
  classification, reasons: [],
});

describe("candidate compatibility", () => {
  it("labels classifications clearly", () => {
    expect(candidateLabel("interesting")).toBe("Interesting");
    expect(candidateLabel("momentum")).toBe("Momentum");
  });
  it("requires strong risk and opportunity before calling a candidate actionable", () => {
    expect(riskCompatibility(candidate("interesting"), 80)).toBe("candidate");
    expect(riskCompatibility(candidate("interesting"), 60)).toBe("review");
    expect(riskCompatibility(candidate("momentum"), 80)).toBe("review");
    expect(riskCompatibility(candidate("interesting"), 40)).toBe("avoid");
  });
});
