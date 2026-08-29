import { describe, expect, it } from "vitest";
import { applySafetyGate } from "../src/core/safety-gate.js";
import type { CandidateResult } from "../src/core/candidate.js";

const candidate = (classification: CandidateResult["classification"]): CandidateResult => ({
  chainId: "solana", baseToken: { address: "mint" }, opportunityScore: 80,
  momentum: { score: 80, flags: [], volumeChangePct: null, liquidityChangePct: null, buyPressure: 0.5 },
  classification, reasons: [],
});

describe("safety gate", () => {
  it("blocks high-risk results even when opportunity is strong", () => {
    const gate = applySafetyGate(candidate("interesting"), 80, ["Freeze authority is active"]);
    expect(gate.blocked).toBe(true);
    expect(gate.decision).toBe("avoid");
  });
  it("blocks scores below the safety threshold", () => {
    const gate = applySafetyGate(candidate("interesting"), 44, []);
    expect(gate.blocked).toBe(true);
    expect(gate.decision).toBe("avoid");
  });
  it("allows only strong candidates through as candidates", () => {
    const gate = applySafetyGate(candidate("interesting"), 75, []);
    expect(gate.blocked).toBe(false);
    expect(gate.decision).toBe("candidate");
  });
  it("keeps weaker classifications in manual review", () => {
    expect(applySafetyGate(candidate("momentum"), 80, []).decision).toBe("review");
  });
});
