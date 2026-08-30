import { discoverCandidates, fetchSolanaPairs, type DiscoveredPair } from "../core/market-discovery.js";
import { score, riskFlags } from "../core/scoring.js";

type Pair = DiscoveredPair & { priceChange?: { h1?: number; h24?: number } };

export function isSolanaAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

export async function tokenPairs(address: string, fetchImpl: typeof fetch = fetch): Promise<Pair[]> {
  if (!isSolanaAddress(address)) return [];
  const response = await fetchImpl(`https://api.dexscreener.com/token-pairs/v1/solana/${encodeURIComponent(address)}`);
  if (!response.ok) throw new Error(`DexScreener HTTP ${response.status}`);
  const data = await response.json() as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected market-data response");
  return data.filter((p): p is Pair => typeof p === "object" && p !== null && (p as Pair).chainId === "solana")
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)).slice(0, 3);
}

export async function scanCandidates(): Promise<DiscoveredPair[]> {
  return discoverCandidates(await fetchSolanaPairs()).sort((a, b) => score(b) - score(a)).slice(0, 5);
}

export { riskFlags, score };
