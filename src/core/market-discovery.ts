export type DiscoveredPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  txns?: { h24?: { buys?: number; sells?: number } };
};

export async function fetchSolanaPairs(fetchImpl: typeof fetch = fetch): Promise<DiscoveredPair[]> {
  const response = await fetchImpl("https://api.dexscreener.com/latest/dex/search?q=SOL");
  if (!response.ok) throw new Error(`DexScreener request failed: ${response.status}`);
  const data = await response.json() as { pairs?: DiscoveredPair[] };
  return (data.pairs ?? []).filter((pair) => pair.chainId === "solana");
}

export function discoverCandidates(pairs: DiscoveredPair[], now = Date.now()): DiscoveredPair[] {
  return pairs
    .filter((p) => p.chainId === "solana")
    .filter((p) => Boolean(p.baseToken?.address))
    .filter((p) => (p.liquidity?.usd ?? 0) >= 10_000)
    .filter((p) => (p.volume?.h24 ?? 0) >= 10_000)
    .filter((p) => {
      if (!p.pairCreatedAt) return true;
      const ageHours = (now - p.pairCreatedAt) / 3_600_000;
      return ageHours >= 0.25;
    })
    .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
}
