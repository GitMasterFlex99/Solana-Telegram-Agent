import { describe, expect, it } from "vitest";
import { mergeScannerResults } from "../src/core/unified-scanner.js";
import type { ScannerResult } from "../src/core/scanner.js";
import type { PumpfunScannerResult } from "../src/core/pumpfun-scanner.js";

const market = (address: string, score: number): ScannerResult => ({
  chainId: "solana", baseToken: { address, symbol: "MKT" }, opportunityScore: score,
  momentum: { score, flags: [], volumeChangePct: null, liquidityChangePct: null, buyPressure: 0.5 },
});
const pump = (address: string, score: number): PumpfunScannerResult => ({
  address, name: "Pump", symbol: "PUMP", marketCapUsd: 50_000, createdAt: Date.now(), url: `https://pump.fun/coin/${address}`,
  launchpad: "pumpfun", stage: "bonding-curve", pumpfunSignal: { score, flags: [] }, opportunityScore: score,
});

describe("unified scanner", () => {
  it("merges both sources and ranks by opportunity", () => {
    const result = mergeScannerResults([market("dex", 60)], [pump("pump", 80)]);
    expect(result.map((candidate) => candidate.source)).toEqual(["pumpfun", "dexscreener"]);
  });
  it("deduplicates token addresses across sources", () => {
    const result = mergeScannerResults([market("same", 60)], [pump("same", 80)]);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("dexscreener");
  });
});
