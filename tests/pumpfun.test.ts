import { describe, expect, it } from "vitest";
import { assessPumpfunSignal, fetchPumpfunCoins, normalizePumpfunCoin } from "../src/core/pumpfun.js";

const MINT = "11111111111111111111111111111111";

describe("pump.fun integration", () => {
  it("normalizes a Pump.fun coin", () => {
    const coin = normalizePumpfunCoin({ mint: MINT, name: "Test", symbol: "TEST", createdAt: Date.now(), marketCapUsd: 50_000, stage: "bonding-curve" });
    expect(coin?.launchpad).toBe("pumpfun");
    expect(coin?.stage).toBe("bonding-curve");
    expect(coin?.url).toContain(`pump.fun/coin/${MINT}`);
  });

  it("rejects incomplete discovery records", () => {
    expect(normalizePumpfunCoin({ name: "Test", symbol: "TEST" })).toBeNull();
  });

  it("treats Mayhem Mode as a risk signal", () => {
    const result = assessPumpfunSignal({ address: MINT, name: "Test", symbol: "TEST", marketCapUsd: 50_000, createdAt: Date.now(), url: `https://pump.fun/coin/${MINT}`, launchpad: "pumpfun", stage: "bonding-curve", mayhemMode: true });
    expect(result.flags).toContain("Mayhem Mode enabled; automated trading can affect early price action");
  });

  it("fetches and normalizes an array response without needing a live network", async () => {
    const fakeFetch = (async () => new Response(JSON.stringify([{ address: MINT, name: "Test", symbol: "TEST", createdAt: Date.now(), marketCapUsd: 10_000 }]), { status: 200 })) as typeof fetch;
    const coins = await fetchPumpfunCoins("https://example.test/coins", fakeFetch);
    expect(coins).toHaveLength(1);
    expect(coins[0].address).toBe(MINT);
  });
});
