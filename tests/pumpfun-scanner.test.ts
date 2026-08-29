import { describe, expect, it } from "vitest";
import { rankPumpfunCoins } from "../src/core/pumpfun-scanner.js";
import type { PumpfunCoin } from "../src/core/pumpfun.js";

const coin = (overrides: Partial<PumpfunCoin> = {}): PumpfunCoin => ({
  address: "mint",
  name: "Test",
  symbol: "TEST",
  marketCapUsd: 50_000,
  createdAt: Date.now() - 30 * 60_000,
  url: "https://pump.fun/coin/mint",
  launchpad: "pumpfun",
  stage: "bonding-curve",
  ...overrides,
});

describe("Pump.fun scanner", () => {
  it("prioritizes strong early bonding-curve signals", () => {
    const ranked = rankPumpfunCoins([
      coin({ address: "weak", createdAt: Date.now() - 2 * 86_400_000, stage: "unknown", marketCapUsd: 300_000 }),
      coin({ address: "early", marketCapUsd: 40_000 }),
    ]);
    expect(ranked[0].address).toBe("early");
  });

  it("penalizes Mayhem Mode rather than treating it as bullish by default", () => {
    const normal = rankPumpfunCoins([coin({ address: "normal" })])[0];
    const mayhem = rankPumpfunCoins([coin({ address: "mayhem", mayhemMode: true })])[0];
    expect(mayhem.opportunityScore).toBeLessThan(normal.opportunityScore);
  });
});
