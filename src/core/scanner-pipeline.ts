import { filterAndRankPairs, type ScannerPair, type ScannerResult } from "./scanner.js";
import { fetchPumpfunCoins } from "./pumpfun.js";
import { rankPumpfunCoins } from "./pumpfun-scanner.js";
import { getRiskProfileConfig, type RiskProfile } from "./risk-profile.js";

export type PipelineResult = ScannerResult & {
  source: "dexscreener" | "pumpfun";
  pumpfunStage?: "bonding-curve" | "pumpswap" | "unknown";
  pumpfunMayhemMode?: boolean;
};

function pumpfunToScannerResult(coin: ReturnType<typeof rankPumpfunCoins>[number]): PipelineResult {
  return {
    chainId: "solana",
    baseToken: { address: coin.address, symbol: coin.symbol, name: coin.name },
    url: coin.url,
    liquidity: { usd: 0 },
    volume: { h24: 0 },
    priceChange: { h24: 0 },
    fdv: coin.marketCapUsd,
    pairCreatedAt: coin.createdAt,
    opportunityScore: coin.opportunityScore,
    momentum: { score: coin.pumpfunSignal.score, flags: coin.pumpfunSignal.flags, volumeChangePct: null, liquidityChangePct: null, buyPressure: 0.5 },
    source: "pumpfun",
    pumpfunStage: coin.stage,
    pumpfunMayhemMode: coin.mayhemMode,
  };
}

export async function scanSources(
  profile: RiskProfile,
  now = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<PipelineResult[]> {
  const config = getRiskProfileConfig(profile);
  const marketResponse = await fetchImpl("https://api.dexscreener.com/latest/dex/search?q=SOL");
  if (!marketResponse.ok) throw new Error("Market data unavailable");
  const marketBody = await marketResponse.json() as { pairs?: ScannerPair[] };
  const market = filterAndRankPairs(Array.isArray(marketBody.pairs) ? marketBody.pairs : [], config, now, 10)
    .map((result) => ({ ...result, source: "dexscreener" as const }));

  const endpoint = process.env.PUMPFUN_DISCOVERY_ENDPOINT;
  if (!endpoint) return market;

  const coins = await fetchPumpfunCoins(endpoint, fetchImpl);
  const pump = rankPumpfunCoins(coins, 10).map(pumpfunToScannerResult);
  const byAddress = new Set<string>();
  return [...market, ...pump]
    .filter((candidate) => {
      const address = candidate.baseToken?.address;
      if (!address || byAddress.has(address)) return false;
      byAddress.add(address);
      return true;
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10);
}
