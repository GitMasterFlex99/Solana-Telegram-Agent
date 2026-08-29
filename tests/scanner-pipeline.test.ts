import { describe, expect, it, vi, afterEach } from "vitest";
import { scanSources } from "../src/core/scanner-pipeline.js";

const response = (body: unknown, ok = true): Response => ({ ok, status: ok ? 200 : 503, json: async () => body } as Response);

afterEach(() => vi.unstubAllEnvs());

describe("scanner pipeline", () => {
  it("uses DexScreener when Pump.fun discovery is not configured", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ pairs: [{ chainId: "solana", baseToken: { address: "dex", symbol: "DEX" }, liquidity: { usd: 30_000 }, volume: { h24: 60_000 }, pairCreatedAt: Date.now() - 7 * 3_600_000, txns: { h24: { buys: 20, sells: 10 } }, priceChange: { h24: 10 } }] }));
    const result = await scanSources("balanced", Date.now(), fetchImpl);
    expect(result[0].source).toBe("dexscreener");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("merges configured Pump.fun discovery and removes duplicate mints", async () => {
    vi.stubEnv("PUMPFUN_DISCOVERY_ENDPOINT", "https://example.invalid/pumpfun");
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ pairs: [{ chainId: "solana", baseToken: { address: "same", symbol: "DEX" }, liquidity: { usd: 30_000 }, volume: { h24: 60_000 }, pairCreatedAt: Date.now() - 7 * 3_600_000, txns: { h24: { buys: 20, sells: 10 } }, priceChange: { h24: 10 } }] }))
      .mockResolvedValueOnce(response([{ address: "same", name: "Pump", symbol: "PUMP", marketCapUsd: 50_000, createdAt: Date.now() - 3_600_000, stage: "bonding-curve" }]));
    const result = await scanSources("balanced", Date.now(), fetchImpl);
    expect(result.filter((x) => x.baseToken?.address === "same")).toHaveLength(1);
    expect(result[0].source).toBe("dexscreener");
  });
});
