import { describe, expect, it } from "vitest";
import { filterAndRankPairs, opportunityScore, pairAgeHours, type ScannerPair } from "../src/core/scanner.js";

const base = (overrides: Partial<ScannerPair> = {}): ScannerPair => ({
  chainId: "solana",
  baseToken: { address: "mint-1", symbol: "TEST" },
  liquidity: { usd: 50_000 },
  volume: { h24: 100_000 },
  priceChange: { h24: 20 },
  txns: { h24: { buys: 80, sells: 40 } },
  fdv: 2_000_000,
  pairCreatedAt: 3_600_000,
  ...overrides,
});

describe("scanner foundation", () => {
  it("calculates pair age from the supplied clock", () => {
    expect(pairAgeHours(base(), 7_200_000)).toBe(1);
    expect(pairAgeHours({ chainId: "solana" }, 7_200_000)).toBe(Infinity);
  });

  it("rejects non-Solana, duplicate, under-liquidity and under-volume pairs", () => {
    const result = filterAndRankPairs([
      base(),
      base({ baseToken: { address: "mint-1", symbol: "DUP" } }),
      base({ chainId: "ethereum", baseToken: { address: "mint-2" } }),
      base({ baseToken: { address: "mint-3" }, liquidity: { usd: 1_000 } }),
      base({ baseToken: { address: "mint-4" }, volume: { h24: 1_000 } }),
    ], { minLiquidityUsd: 10_000, minVolume24hUsd: 10_000, minAgeHours: 0, allowVeryNew: true });
    expect(result.map((p) => p.baseToken?.address)).toEqual(["mint-1"]);
  });

  it("applies the age gate unless very-new pairs are allowed", () => {
    const fresh = base({ pairCreatedAt: 7_000_000 });
    expect(filterAndRankPairs([fresh], { minLiquidityUsd: 10_000, minVolume24hUsd: 10_000, minAgeHours: 6, allowVeryNew: false }, 7_200_000)).toHaveLength(0);
    expect(filterAndRankPairs([fresh], { minLiquidityUsd: 10_000, minVolume24hUsd: 10_000, minAgeHours: 6, allowVeryNew: true }, 7_200_000)).toHaveLength(1);
  });

  it("ranks stronger liquidity, volume and buy pressure higher", () => {
    const strong = base({ baseToken: { address: "strong" }, liquidity: { usd: 200_000 }, volume: { h24: 600_000 }, txns: { h24: { buys: 90, sells: 10 } } });
    const weak = base({ baseToken: { address: "weak" }, liquidity: { usd: 12_000 }, volume: { h24: 12_000 }, txns: { h24: { buys: 10, sells: 90 } } });
    expect(opportunityScore(strong)).toBeGreaterThan(opportunityScore(weak));
  });

  it("returns momentum and uses it in the final ranking score", () => {
    const accelerating = base({
      baseToken: { address: "accelerating" },
      previous: { volume24hUsd: 50_000, liquidityUsd: 40_000 },
      volume: { h24: 150_000 },
      liquidity: { usd: 60_000 },
      txns: { h24: { buys: 80, sells: 20 } },
    });
    const flat = base({
      baseToken: { address: "flat" },
      previous: { volume24hUsd: 100_000, liquidityUsd: 50_000 },
      txns: { h24: { buys: 50, sells: 50 } },
    });
    const result = filterAndRankPairs([flat, accelerating], { minLiquidityUsd: 10_000, minVolume24hUsd: 10_000, minAgeHours: 0, allowVeryNew: true }, Date.now());
    expect(result[0].baseToken?.address).toBe("accelerating");
    expect(result[0].momentum.score).toBeGreaterThan(result[1].momentum.score);
    expect(result[0].opportunityScore).toBeGreaterThan(result[1].opportunityScore);
  });
});
