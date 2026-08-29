import { describe, expect, it } from "vitest";
import { assessCombinedRisk } from "../src/core/combined-risk.js";

const healthyMarket = {
  liquidityUsd: 100_000,
  volume24hUsd: 500_000,
  buys24h: 80,
  sells24h: 40,
  priceChange24h: 20,
  fdvUsd: 2_000_000,
  ageHours: 48,
};

describe("combined risk", () => {
  it("penalizes active authorities and concentration", () => {
    const result = assessCombinedRisk(healthyMarket, {
      mint: "mint",
      tokenProgram: "spl-token",
      mintAuthorityActive: true,
      freezeAuthorityActive: true,
      supply: 1_000_000,
      topHolderPercent: 25,
      top5HolderPercent: 60,
      flags: ["Mint authority is still active", "Freeze authority is still active"],
    });

    expect(result.score).toBeLessThan(result.market.score);
    expect(result.label).not.toBe("Low");
    expect(result.hardWarnings).toContain("Mint authority is active");
    expect(result.hardWarnings).toContain("Top-five holder concentration is very high");
  });

  it("treats an unverifiable token program as a major warning", () => {
    const result = assessCombinedRisk(healthyMarket, {
      mint: "mint",
      tokenProgram: "unknown",
      mintAuthorityActive: null,
      freezeAuthorityActive: null,
      supply: null,
      topHolderPercent: null,
      top5HolderPercent: null,
      flags: ["Token program could not be verified"],
    });

    expect(result.score).toBeLessThan(result.market.score);
    expect(result.hardWarnings).toContain("Token program could not be verified");
  });

  it("does not treat Token-2022 itself as a failure", () => {
    const result = assessCombinedRisk(healthyMarket, {
      mint: "mint",
      tokenProgram: "token-2022",
      mintAuthorityActive: false,
      freezeAuthorityActive: false,
      supply: 1_000_000,
      topHolderPercent: 3,
      top5HolderPercent: 12,
      flags: ["Token uses Token-2022; extensions require additional review"],
    });

    expect(result.hardWarnings).toHaveLength(0);
    expect(result.score).toBe(result.market.score - 5);
  });
});
