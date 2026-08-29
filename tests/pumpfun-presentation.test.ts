import { describe, expect, it } from "vitest";
import { pumpfunPresentation } from "../src/core/pumpfun-presentation.js";
import type { PumpfunCoin } from "../src/core/pumpfun.js";

const coin = (overrides: Partial<PumpfunCoin> = {}): PumpfunCoin => ({
  address: "mint", name: "Test", symbol: "TEST", marketCapUsd: 50_000,
  createdAt: Date.now() - 30 * 60_000, url: "https://pump.fun/coin/mint",
  launchpad: "pumpfun", stage: "bonding-curve", ...overrides,
});

describe("Pump.fun presentation", () => {
  it("shows source and bonding-curve warning", () => {
    const text = pumpfunPresentation(coin(), { score: 70, flags: [] }).join("\\n");
    expect(text).toContain("Source: Pump.fun");
    expect(text).toContain("BONDING CURVE");
    expect(text).toContain("Early-stage coin");
  });
  it("shows Mayhem Mode warning", () => {
    const text = pumpfunPresentation(coin({ mayhemMode: true }), { score: 55, flags: [] }).join("\\n");
    expect(text).toContain("Mayhem Mode");
  });
  it("shows graduation state", () => {
    const text = pumpfunPresentation(coin({ stage: "pumpswap" }), { score: 55, flags: [] }).join("\\n");
    expect(text).toContain("PUMPSWAP");
    expect(text).toContain("Graduated");
  });
});
