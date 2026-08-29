export type ScannerPair = {
  chainId?: string;
  baseToken?: { address?: string; symbol?: string; name?: string };
  url?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  txns?: { h24?: { buys?: number; sells?: number } };
  fdv?: number;
  pairCreatedAt?: number;
};

export type ScannerConfig = {
  minLiquidityUsd: number;
  minVolume24hUsd: number;
  minAgeHours: number;
  allowVeryNew: boolean;
};

export type ScannerResult = ScannerPair & { opportunityScore: number };

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function pairAgeHours(pair: ScannerPair, now = Date.now()): number {
  if (!finite(pair.pairCreatedAt)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now - pair.pairCreatedAt) / 3_600_000);
}

export function opportunityScore(pair: ScannerPair): number {
  const liquidity = pair.liquidity?.usd ?? 0;
  const volume = pair.volume?.h24 ?? 0;
  const buys = pair.txns?.h24?.buys ?? 0;
  const sells = pair.txns?.h24?.sells ?? 0;
  const change = pair.priceChange?.h24 ?? 0;
  let score = 0;

  if (liquidity >= 100_000) score += 30;
  else if (liquidity >= 25_000) score += 22;
  else if (liquidity >= 10_000) score += 12;

  if (volume >= 500_000) score += 25;
  else if (volume >= 100_000) score += 18;
  else if (volume >= 25_000) score += 10;

  const trades = buys + sells;
  if (trades > 0) score += Math.min(20, Math.round((buys / trades) * 20));
  if (change > 0 && change < 100) score += 10;
  else if (change >= 100) score += 4;

  if (liquidity > 0 && (pair.fdv ?? 0) / liquidity < 100) score += 10;
  if (pairAgeHours(pair) < 2) score -= 15;

  return Math.max(0, Math.min(100, score));
}

export function filterAndRankPairs(
  pairs: ScannerPair[],
  config: ScannerConfig,
  now = Date.now(),
  limit = 5,
): ScannerResult[] {
  const seen = new Set<string>();
  return pairs
    .filter((pair) => {
      const address = pair.baseToken?.address;
      if (!address || seen.has(address)) return false;
      seen.add(address);
      if (pair.chainId !== "solana") return false;
      if ((pair.liquidity?.usd ?? 0) < config.minLiquidityUsd) return false;
      if ((pair.volume?.h24 ?? 0) < config.minVolume24hUsd) return false;
      const age = pairAgeHours(pair, now);
      if (!config.allowVeryNew && age < config.minAgeHours) return false;
      return true;
    })
    .map((pair) => ({ ...pair, opportunityScore: opportunityScore(pair) }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, limit);
}
