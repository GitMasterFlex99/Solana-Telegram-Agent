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
  security?: { riskLevel?: string };
};

type TokenProfile = { chainId?: string; tokenAddress?: string };
const SOL_MINT = "So11111111111111111111111111111111111111112";
const MAX_DISCOVERY_PROFILES = 60;
const TOKEN_BATCH_SIZE = 30;

async function fetchJson<T>(fetchImpl: typeof fetch, url: string): Promise<T> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`DexScreener request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchSolanaPairs(fetchImpl: typeof fetch = fetch): Promise<DiscoveredPair[]> {
  const profiles = await fetchJson<TokenProfile[]>(fetchImpl, "https://api.dexscreener.com/token-profiles/latest/v1");
  const addresses = [...new Set(profiles.filter(p => p.chainId === "solana").map(p => p.tokenAddress).filter((a): a is string => Boolean(a) && a !== SOL_MINT))].slice(0, MAX_DISCOVERY_PROFILES);
  const pairs: DiscoveredPair[] = [];
  for (let offset = 0; offset < addresses.length; offset += TOKEN_BATCH_SIZE) {
    const batch = addresses.slice(offset, offset + TOKEN_BATCH_SIZE);
    try {
      const batchPairs = await fetchJson<DiscoveredPair[]>(fetchImpl, `https://api.dexscreener.com/tokens/v1/solana/${batch.map(encodeURIComponent).join(",")}`);
      pairs.push(...batchPairs.filter(p => p.chainId === "solana"));
    } catch { /* keep other batches */ }
  }
  const byToken = new Map<string, DiscoveredPair>();
  for (const pair of pairs) {
    const address = pair.baseToken?.address;
    if (!address || address === SOL_MINT || pair.baseToken?.symbol?.toUpperCase() === "SOL") continue;
    const current = byToken.get(address);
    byToken.set(address, current ? betterPair(current, pair) : pair);
  }
  return [...byToken.values()];
}

function betterPair(a: DiscoveredPair, b: DiscoveredPair): DiscoveredPair {
  const la = a.liquidity?.usd ?? 0, lb = b.liquidity?.usd ?? 0;
  if (la !== lb) return la > lb ? a : b;
  return (a.volume?.h24 ?? 0) >= (b.volume?.h24 ?? 0) ? a : b;
}

export function discoverCandidates(pairs: DiscoveredPair[], now = Date.now()): DiscoveredPair[] {
  const candidates = pairs.filter(p => p.chainId === "solana")
    .filter(p => p.baseToken?.address !== SOL_MINT)
    .filter(p => p.baseToken?.symbol?.toUpperCase() !== "SOL")
    .filter(p => Boolean(p.baseToken?.address))
    .filter(p => p.security?.riskLevel?.toLowerCase() !== "danger")
    .filter(p => (p.liquidity?.usd ?? 0) >= 5_000)
    .filter(p => (p.volume?.h24 ?? 0) >= 5_000)
    .filter(p => {
      if (!p.pairCreatedAt) return true;
      return (now - p.pairCreatedAt) / 3_600_000 >= 0.25;
    });
  const byToken = new Map<string, DiscoveredPair>();
  for (const pair of candidates) {
    const address = pair.baseToken!.address!;
    const existing = byToken.get(address);
    byToken.set(address, existing ? betterPair(existing, pair) : pair);
  }
  return [...byToken.values()].sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
}
