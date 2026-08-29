export type PumpfunCoin = {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  imageUri?: string;
  marketCapUsd: number;
  createdAt: number;
  creator?: string;
  url: string;
  launchpad: "pumpfun";
  stage: "bonding-curve" | "pumpswap" | "unknown";
  mayhemMode?: boolean;
};

export type PumpfunSignal = { score: number; flags: string[] };

export function assessPumpfunSignal(coin: PumpfunCoin): PumpfunSignal {
  let score = 50;
  const flags: string[] = [];
  const ageHours = Math.max(0, (Date.now() - coin.createdAt) / 3_600_000);
  if (coin.stage === "bonding-curve") { score += 10; flags.push("Still on Pump.fun bonding curve"); }
  else if (coin.stage === "pumpswap") { score += 5; flags.push("Graduated to PumpSwap"); }
  if (ageHours <= 1) { score += 12; flags.push("Very early launch"); }
  else if (ageHours <= 6) { score += 7; flags.push("Early launch"); }
  if (coin.marketCapUsd > 0 && coin.marketCapUsd < 100_000) { score += 5; flags.push("Low market cap / high volatility zone"); }
  if (coin.mayhemMode) { score -= 15; flags.push("Mayhem Mode enabled; automated trading can affect early price action"); }
  return { score: Math.max(0, Math.min(100, score)), flags };
}

function isSolanaAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function safePumpfunUrl(address: string, value: unknown): string {
  if (typeof value !== "string") return `https://pump.fun/coin/${address}`;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "pump.fun" ? url.href : `https://pump.fun/coin/${address}`;
  } catch { return `https://pump.fun/coin/${address}`; }
}

export function normalizePumpfunCoin(input: Record<string, unknown>): PumpfunCoin | null {
  const address = typeof input.address === "string" ? input.address : typeof input.mint === "string" ? input.mint : null;
  const name = typeof input.name === "string" ? input.name : null;
  const symbol = typeof input.symbol === "string" ? input.symbol : null;
  const createdAt = typeof input.createdAt === "number" ? input.createdAt : typeof input.created_at === "number" ? input.created_at : null;
  if (!address || !isSolanaAddress(address) || !name || !symbol || createdAt === null || !Number.isFinite(createdAt)) return null;
  const marketCapUsd = typeof input.marketCapUsd === "number" ? input.marketCapUsd : typeof input.market_cap === "number" ? input.market_cap : 0;
  if (!Number.isFinite(marketCapUsd) || marketCapUsd < 0) return null;
  return {
    address, name: name.slice(0, 200), symbol: symbol.slice(0, 50), marketCapUsd, createdAt,
    description: typeof input.description === "string" ? input.description.slice(0, 2_000) : undefined,
    imageUri: typeof input.imageUri === "string" ? input.imageUri.slice(0, 2_000) : undefined,
    creator: typeof input.creator === "string" ? input.creator : undefined,
    url: safePumpfunUrl(address, input.url), launchpad: "pumpfun",
    stage: input.stage === "pumpswap" ? "pumpswap" : input.stage === "bonding-curve" ? "bonding-curve" : "unknown",
    mayhemMode: input.mayhemMode === true,
  };
}

export async function fetchPumpfunCoins(endpoint: string, fetchImpl: typeof fetch = fetch): Promise<PumpfunCoin[]> {
  let url: URL;
  try { url = new URL(endpoint); } catch { throw new Error("Invalid Pump.fun discovery endpoint"); }
  if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("Pump.fun discovery endpoint must use HTTPS");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetchImpl(url.href, { signal: controller.signal });
    if (!response.ok) throw new Error(`Pump.fun returned ${response.status}`);
    const body = await response.json() as unknown;
    const rows = Array.isArray(body) ? body : typeof body === "object" && body !== null && Array.isArray((body as { coins?: unknown[] }).coins) ? (body as { coins: unknown[] }).coins : [];
    return rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null).map(normalizePumpfunCoin).filter((coin): coin is PumpfunCoin => coin !== null);
  } finally { clearTimeout(timeout); }
}
