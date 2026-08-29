import { describe, expect, it } from "vitest";
import { evaluateWatchlist } from "../src/core/watchlist-monitor.js";
import type { PipelineResult } from "../src/core/scanner-pipeline.js";
import type { WatchItem } from "../src/core/watchlist-store.js";

const pair = (opportunityScore: number, momentum: number): PipelineResult => ({
  chainId: "solana",
  baseToken: { address: "mint", symbol: "TEST" },
  liquidity: { usd: 20_000 },
  volume: { h24: 30_000 },
  priceChange: { h24: 5 },
  opportunityScore,
  momentum: { score: momentum, flags: [], volumeChangePct: null, liquidityChangePct: null, buyPressure: 0.5 },
  source: "dexscreener",
});

const item: WatchItem = { address: "mint", label: "TEST", addedAt: 1 };

describe("watchlist monitor", () => {
  it("emits meaningful signal changes", () => {
    const previous = new Map([["mint", { opportunity: 50, momentum: 50, priceChange24h: 0 }]]);
    const alerts = evaluateWatchlist(42, [item], [pair(70, 70)], previous);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].events).toEqual(["momentum_jump", "opportunity_jump"]);
  });

  it("does not alert on the first observation", () => {
    const alerts = evaluateWatchlist(42, [item], [pair(90, 90)], new Map());
    expect(alerts).toHaveLength(0);
  });

  it("ignores watched tokens missing from the current scan", () => {
    const previous = new Map([["mint", { opportunity: 50, momentum: 50, priceChange24h: 0 }]]);
    expect(evaluateWatchlist(42, [item], [], previous)).toHaveLength(0);
  });
});
