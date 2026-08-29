import { filterAndRankPairs, type ScannerPair, type ScannerResult } from "./scanner.js";
import { fetchPumpfunCoins } from "./pumpfun.js";
import { rankPumpfunCoins } from "./pumpfun-scanner.js";
import { getRiskProfileConfig, type RiskProfile } from "./risk-profile.js";

const DEXSCREENER_TIMEOUT_MS = 8_000;

type FetchWithTimeout = typeof fetch;

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

async function fetchJsonWithTimeout(fetchImpl: FetchWithTimeout, url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEXSCREENER_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanSources(profile: RiskProfile, now = Date.now(), fetchImpl: FetchWithTimeout = fetch): Promise<PipelineResult[]> {
  const config = getRiskProfileConfig(profile);
  let market: PipelineResult[] = [];

  try {
    const marketResponse = await fetchJsonWithTimeout(fetchImpl, "https://api.dexscreener.com/latest/dex/search?q=SOL");
    if (!marketResponse.ok) throw new Error(`DexScreener returned ${marketResponse.status}`);
    const marketBody = await marketResponse.json() as { pairs?: ScannerPair[] };
    market = filterAndRankPairs(Array.isArray(marketBody.pairs) ? marketBody.pairs : [], config, now, 10)
      .map((result) => ({ ...result, source: "dexscreener" as const }));
  } catch {
    // The pipeline can still return Pump.fun results when the market source is unavailable.
  }

  const endpoint = process.env.PUMPFUN_DISCOVERY_ENDPOINT;
  if (!endpoint) return market;

  try {
    const coins = await fetchPumpfunCoins(endpoint, fetchImpl);
    const eligibleCoins = coins.filter((coin) => {
      const ageHours = Math.max(0, (now - coin.createdAt) / 3_600_000);
      if (!config.allowVeryNew && ageHours < config.minAgeHours) return false;
      if (config.minLiquidityUsd > 10_000 && coin.stage === "bonding-curve") return false;
      return true;
    });
    const pump = rankPumpfunCoins(eligibleCoins, 10, now).map(pumpfunToScannerResult);
    const byAddress = new Set<string>();
    return [...market, ...pump].filter((candidate) => {
      const address = candidate.baseToken?.address;
      if (!address || byAddress.has(address)) return false;
      byAddress.add(address);
      return true;
    }).sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 10);
  } catch {
    // Pump.fun is an optional source; preserve healthy DexScreener results if it fails.
    return market;
  }
}
