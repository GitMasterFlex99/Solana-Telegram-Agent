import { describe, expect, it } from "vitest";
import { classifyCandidate } from "../src/core/candidate.js";
import type { ScannerResult } from "../src/core/scanner.js";

const result = (opportunityScore: number, momentumScore: number): ScannerResult => ({
  chainId: "solana",
  baseToken: { address: "mint", symbol: "TEST" },
  opportunityScore,
  momentum: { score: momentumScore, flags: [], volumeChangePct: null, liquidityChangePct: null, buyPressure: 0.5 },
});

describe("candidate classification", () => {
  it("identifies strong opportunity plus momentum", () => {
    const candidate = classifyCandidate(result(80, 70));
    expect(candidate.classification).toBe("interesting");
    expect(candidate.reasons).toContain("Strong opportunity and momentum");
  });

  it("keeps momentum-only candidates distinct", () => {
    expect(classifyCandidate(result(40, 75)).classification).toBe("momentum");
  });

  it("marks moderate candidates for monitoring", () => {
    expect(classifyCandidate(result(60, 50)).classification).toBe("caution");
  });

  it("does not inflate weak candidates", () => {
    expect(classifyCandidate(result(30, 30)).classification).toBe("weak");
  });
});
