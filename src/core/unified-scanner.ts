import type { ScannerResult } from "./scanner.js";
import { rankPumpfunCoins, type PumpfunScannerResult } from "./pumpfun-scanner.js";

export type UnifiedCandidate =
  | ({ source: "dexscreener" } & ScannerResult)
  | ({ source: "pumpfun" } & PumpfunScannerResult);

const addressOf = (candidate: UnifiedCandidate): string | undefined =>
  candidate.source === "pumpfun" ? candidate.address : candidate.baseToken?.address;

export function mergeScannerResults(
  marketResults: ScannerResult[],
  pumpfunResults: PumpfunScannerResult[],
  limit = 10,
): UnifiedCandidate[] {
  const market: UnifiedCandidate[] = marketResults.map((result) => ({ ...result, source: "dexscreener" as const }));
  const pump: UnifiedCandidate[] = pumpfunResults.map((result) => ({ ...result, source: "pumpfun" as const }));
  const seen = new Set<string>();
  return [...market, ...pump]
    .filter((candidate) => {
      const address = addressOf(candidate);
      if (!address || seen.has(address)) return false;
      seen.add(address);
      return true;
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, limit);
}

export { rankPumpfunCoins };
