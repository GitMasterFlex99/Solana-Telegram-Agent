import { fetchRugCheckSummary, type RugCheckSummary } from "../services/rugcheck.js";

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
  security?: RugCheckSummary;
};

type TokenProfile = { chainId?: string; tokenAddress?: string };
const SOL_MINT = "So11111111111111111111111111111111111111112";

async function fetchJson<T>(fetchImpl: typeof fetch, url: string): Promise<T> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`DexScreener request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchSolanaPairs(fetchImpl: typeof fetch = fetch): Promise<DiscoveredPair[]> {
  const profiles = await fetchJson<TokenProfile[]>(fetchImpl, "https://api.dexscreener.com/token-profiles/latest/v1");
  const addresses = [...new Set(
    profiles.filter((profile) => profile.chainId === "solana")
      .map((profile) => profile.tokenAddress)
      .filter((address): address is string => Boolean(address) && address !== SOL_MINT)
  )].slice(0, 50);

  const results = await Promise.all(addresses.map(async (address) => {
    try {
      const pairs = await fetchJson<DiscoveredPair[]>(fetchImpl, `https://api.dexscreener.com/token-pairs/v1/solana/${encodeURIComponent(address)}`);
      return pairs.filter((pair) => pair.chainId === "solana");
    } catch {
      return [];
    }
  }));

  const pairs = results.flat();
  const bestByToken = new Map<string, DiscoveredPair>();
  for (const pair of pairs) {
    const address = pair.baseToken?.address;
    if (!address || address === SOL_MINT || pair.baseToken?.symbol?.toUpperCase() === "SOL") continue;
    const current = bestByToken.get(address);
    if (!current) bestByToken.set(address, pair);
    else {
      const currentStrength = (current.liquidity?.usd ?? 0) * 0.6 + (current.volume?.h24 ?? 0) * 0.4;
      const pairStrength = (pair.liquidity?.usd ?? 0) * 0.6 + (pair.volume?.h24 ?? 0) * 0.4;
      if (pairStrength > currentStrength) bestByToken.set(address, pair);
    }
  }

  const securityAddresses = [...bestByToken.entries()]
    .sort((a, b) => {
      const aStrength = (a[1].liquidity?.usd ?? 0) * 0.6 + (a[1].volume?.h24 ?? 0) * 0.4;
      const bStrength = (b[1].liquidity?.usd ?? 0) * 0.6 + (b[1].volume?.h24 ?? 0) * 0.4;
      return bStrength - aStrength;
    })
    .slice(0, 15)
    .map(([address]) => address);

  const securityEntries = await Promise.all(securityAddresses.map(async (address) => [address, await fetchRugCheckSummary(address, fetchImpl)] as const));
  const securityByToken = new Map<string, RugCheckSummary>();
  for (const [address, security] of securityEntries) if (security) securityByToken.set(address, security);

  return pairs.map((pair) => {
    const address = pair.baseToken?.address;
    return address && securityByToken.has(address) ? { ...pair, security: securityByToken.get(address) } : pair;
  });
}

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
    .filter((p) => p.baseToken?.symbol?.toUpperCase() !== "SOL")
    .filter((p) => Boolean(p.baseToken?.address))
    .filter((p) => (p.liquidity?.usd ?? 0) >= 5_000)
    .filter((p) => (p.volume?.h24 ?? 0) >= 5_000)
    .filter((p) => {
      if (!p.pairCreatedAt) return true;
      const ageHours = (now - p.pairCreatedAt) / 3_600_000;
      return ageHours >= 0.25;
    })
    .filter((p) => p.security?.riskLevel?.toLowerCase() !== "danger");

  const byToken = new Map<string, DiscoveredPair>();
  for (const pair of candidates) {
    const address = pair.baseToken!.address!;
    const existing = byToken.get(address);
    byToken.set(address, existing ? betterPair(existing, pair) : pair);
  }
  return [...byToken.values()].sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
}
