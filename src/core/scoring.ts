export type PairLike = {
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  pairCreatedAt?: number;
  txns?: { h24?: { buys?: number; sells?: number } };
};

export function pairAgeHours(pairCreatedAt?: number, now = Date.now()): number | null {
  if (!Number.isFinite(pairCreatedAt)) return null;
  return Math.max(0, (now - Number(pairCreatedAt)) / 3_600_000);
}

export function score(p: PairLike, now = Date.now()): number {
  const liq = p.liquidity?.usd ?? 0;
  const vol = p.volume?.h24 ?? 0;
  const buys = p.txns?.h24?.buys ?? 0;
  const sells = p.txns?.h24?.sells ?? 0;
  const change = p.priceChange?.h24 ?? 0;
  let s = 0;
  if (liq >= 100_000) s += 30; else if (liq >= 25_000) s += 22; else if (liq >= 10_000) s += 12;
  if (vol >= 500_000) s += 25; else if (vol >= 100_000) s += 18; else if (vol >= 25_000) s += 10;
  if (buys + sells > 0 && buys > sells) s += Math.min(20, Math.round(buys / (buys + sells) * 20));
  if (change > 0 && change < 100) s += 10; else if (change >= 100) s += 4;
  if (liq > 0 && (p.fdv ?? 0) / liq < 100) s += 10;
  const hours = pairAgeHours(p.pairCreatedAt, now);
  if (hours !== null && hours < 2) s -= 15;
  return Math.max(0, Math.min(100, s));
}

export function riskFlags(p: PairLike, now = Date.now()): string[] {
  const liq = p.liquidity?.usd ?? 0;
  const vol = p.volume?.h24 ?? 0;
  const flags: string[] = [];
  if (liq < 25_000) flags.push("low liquidity");
  if (liq > 0 && vol / liq > 20) flags.push("very high volume/liquidity");
  const hours = pairAgeHours(p.pairCreatedAt, now);
  if (hours !== null && hours < 24) flags.push("very new pair");
  if ((p.priceChange?.h24 ?? 0) > 200) flags.push("extreme 24h move");
  if ((p.fdv ?? 0) > 0 && liq > 0 && (p.fdv as number) / liq > 100) flags.push("high FDV/liquidity");
  return flags;
}
