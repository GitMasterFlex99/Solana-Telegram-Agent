import { describe, expect, it } from "vitest";
import { discoverPumpfun } from "../src/core/pumpfun-source.js";

const MINT = "11111111111111111111111111111111";
const response = (body: unknown, ok = true, status = 200): Response => ({
  ok, status,
  json: async () => body,
} as Response);

describe("Pump.fun discovery source", () => {
  it("normalizes configured discovery results", async () => {
    const coins = await discoverPumpfun({
      endpoint: "https://example.invalid/pumpfun",
      fetchImpl: async () => response([{ mint: MINT, name: "Test", symbol: "TEST", created_at: 1_700_000_000_000, market_cap: 50_000 }]),
    });
    expect(coins).toHaveLength(1);
    expect(coins[0].address).toBe(MINT);
    expect(coins[0].launchpad).toBe("pumpfun");
  });

  it("supports a coins envelope", async () => {
    const coins = await discoverPumpfun({
      endpoint: "https://example.invalid/pumpfun",
      fetchImpl: async () => response({ coins: [{ address: MINT, name: "Test", symbol: "TEST", createdAt: 1_700_000_000_000 }] }),
    });
    expect(coins).toHaveLength(1);
  });

  it("fails closed on upstream errors", async () => {
    await expect(discoverPumpfun({
      endpoint: "https://example.invalid/pumpfun",
      fetchImpl: async () => response({}, false, 503),
    })).rejects.toThrow("503");
  });
});
