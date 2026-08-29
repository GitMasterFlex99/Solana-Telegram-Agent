import { describe, expect, it } from "vitest";
import { mergeScannerResults } from "../src/core/unified-scanner.js";
import type { ScannerResult } from "../src/core/scanner.js";
import type { PumpfunScannerResult } from "../src/core/pumpfun-scanner.js";

const momentum = { score: 70, flags: [], volumeChangePct: null, liquidityChangePct: null, buyPressure: 0.6 };
const market = (address: string, score: number): ScannerResult => ({ chainId: "solana", baseToken: { address, symbol: "SOL" }, opportunityScore: score, momentum });
const pump = (address: string, score: number): PumpfunScannerResult => ({ address, name: "Pump", symbol: "PUMP", marketCapUsd: 50_000, createdAt: Date.now(), url: `https://pump.fun/coin/${address}`, launchpad: "pumpfun", stage: "bonding-curve", pumpfunSignal: { score, flags: ["Early launch"] }, opportunityScore: score });

describe("unified scanner", () => {
  it("merges DexScreener and Pump.fun results and labels their source", () => {
    const results = mergeScannerResults([market("market", 60)], [pump("pump", 80)]);
    expect(results.map((r) => r.source)).toEqual(["pumpfun", "dexscreener"]);
  });

  it("deduplicates the same mint across sources", () => {
    const results = mergeScannerResults([market("same", 60)], [pump("same", 90)]);
    expect(results).toHaveLength(1);
    expect(results[0].source).toBe("dexscreener");
  });
});
