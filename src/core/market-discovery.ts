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

const SOL_MINT = "So11111111111111111111111111111111111111112";

export async function fetchSolanaPairs(fetchImpl: typeof fetch = fetch): Promise<DiscoveredPair[]> {
  const response = await fetchImpl("https://api.dexscreener.com/latest/dex/search?q=SOL");
  if (!response.ok) throw new Error(`DexScreener request failed: ${response.status}`);
  const data = await response.json() as { pairs?: DiscoveredPair[] };
  return (data.pairs ?? []).filter((pair) => pair.chainId === "solana");
}

/**
 * Keep one representative market per token. The same token can have several
 * pools, and scoring every pool independently can make one token dominate the
 * shortlist. Prefer the pool with the strongest liquidity, then volume.
 */
function betterPair(a: DiscoveredPair, b: DiscoveredPair): DiscoveredPair {
  const liquidityA = a.liquidity?.usd ?? 0;
  const liquidityB = b.liquidity?.usd ?? 0;
  if (liquidityA !== liquidityB) return liquidityA > liquidityB ? a : b;
  return (a.volume?.h24 ?? 0) >= (b.volume?.h24 ?? 0) ? a : b;
}

export function discoverCandidates(pairs: DiscoveredPair[], now = Date.now()): DiscoveredPair[] {
  const candidates = pairs
    .filter((p) => p.chainId === "solana")
    .filter((p) => p.baseToken?.address !== SOL_MINT)
    .filter((p) => Boolean(p.baseToken?.address))
    .filter((p) => (p.liquidity?.usd ?? 0) >= 10_000)
    .filter((p) => (p.volume?.h24 ?? 0) >= 10_000)
    .filter((p) => {
      if (!p.pairCreatedAt) return true;
      const ageHours = (now - p.pairCreatedAt) / 3_600_000;
      return ageHours >= 0.25;
    });

  const byToken = new Map<string, DiscoveredPair>();
  for (const pair of candidates) {
    const address = pair.baseToken!.address!;
    const existing = byToken.get(address);
    byToken.set(address, existing ? betterPair(existing, pair) : pair);
  }

  return [...byToken.values()].sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
}
