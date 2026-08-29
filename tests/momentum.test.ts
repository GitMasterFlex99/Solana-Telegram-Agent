import { describe, expect, it } from "vitest";
import { assessMomentum } from "../src/core/momentum.js";

describe("momentum", () => {
  it("rewards accelerating volume and buy pressure", () => {
    const result = assessMomentum({ volume24hUsd: 220_000, volumePrevious24hUsd: 100_000, liquidityUsd: 60_000, liquidityPreviousUsd: 50_000, buys24h: 70, sells24h: 30, priceChange24h: 20 });
    expect(result.score).toBeGreaterThan(50);
    expect(result.flags).toContain("Volume has more than doubled");
    expect(result.flags).toContain("Buy pressure is elevated");
  });
  it("penalizes sharp liquidity loss and sell pressure", () => {
    const result = assessMomentum({ volume24hUsd: 50_000, volumePrevious24hUsd: 100_000, liquidityUsd: 35_000, liquidityPreviousUsd: 50_000, buys24h: 20, sells24h: 80, priceChange24h: 10 });
    expect(result.score).toBeLessThan(50);
    expect(result.flags).toContain("Liquidity is falling");
    expect(result.flags).toContain("Sell pressure is elevated");
  });
  it("does not invent momentum when there is no baseline", () => {
    const result = assessMomentum({ volume24hUsd: 100_000, volumePrevious24hUsd: null, liquidityUsd: 50_000, liquidityPreviousUsd: null, buys24h: 50, sells24h: 50, priceChange24h: 10 });
    expect(result.volumeChangePct).toBeNull();
    expect(result.liquidityChangePct).toBeNull();
    expect(result.score).toBe(50);
  });
  it("flags overheated price movement", () => {
    const result = assessMomentum({ volume24hUsd: 100_000, volumePrevious24hUsd: 100_000, liquidityUsd: 50_000, liquidityPreviousUsd: 50_000, buys24h: 60, sells24h: 40, priceChange24h: 150 });
    expect(result.flags).toContain("Price has already moved more than 100% in 24h");
  });
});
