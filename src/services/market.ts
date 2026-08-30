import { discoverCandidates, fetchSolanaPairs, type DiscoveredPair } from "../core/market-discovery.js";
import { score, riskFlags } from "../core/scoring.js";

type Pair = DiscoveredPair & { priceChange?: { h1?: number; h24?: number } };

export function isSolanaAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

async function fetchWithRetry(fetchImpl: typeof fetch, input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetchImpl(input, { ...init, signal: controller.signal });
      if (response.ok || (response.status !== 429 && response.status < 500)) return response;
      lastError = new Error(`DexScreener HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt));
  }
  throw lastError instanceof Error ? lastError : new Error("Market request failed");
}

export async function tokenPairs(address: string, fetchImpl: typeof fetch = fetch): Promise<Pair[]> {
  if (!isSolanaAddress(address)) return [];
  const response = await fetchWithRetry(fetchImpl, `https://api.dexscreener.com/token-pairs/v1/solana/${encodeURIComponent(address)}`);
  if (!response.ok) throw new Error(`DexScreener HTTP ${response.status}`);
  const data = await response.json() as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected market-data response");
  return data
    .filter((p): p is Pair => typeof p === "object" && p !== null && (p as Pair).chainId === "solana")
    .filter(p => (p.liquidity?.usd ?? 0) > 0 || (p.volume?.h24 ?? 0) > 0)
    .sort((a, b) => {
      const liquidityDelta = (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0);
      if (liquidityDelta !== 0) return liquidityDelta;
      return (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0);
    })
    .slice(0, 3);
}

export async function scanCandidates(): Promise<DiscoveredPair[]> {
  return discoverCandidates(await fetchSolanaPairs())
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5);
}

export { riskFlags, score };
