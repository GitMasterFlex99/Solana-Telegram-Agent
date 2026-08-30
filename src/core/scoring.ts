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

function activityStats(p: PairLike) {
  const liq = Math.max(0, p.liquidity?.usd ?? 0);
  const vol = Math.max(0, p.volume?.h24 ?? 0);
  const buys = Math.max(0, p.txns?.h24?.buys ?? 0);
  const sells = Math.max(0, p.txns?.h24?.sells ?? 0);
  const transactions = buys + sells;
  const volumeToLiquidity = liq > 0 ? vol / liq : 0;
  const buyShare = transactions > 0 ? buys / transactions : 0;
  return { liq, vol, buys, sells, transactions, volumeToLiquidity, buyShare };
}

export function score(p: PairLike, now = Date.now()): number {
  const { liq, vol, transactions, volumeToLiquidity, buyShare } = activityStats(p);
  const change = Number.isFinite(p.priceChange?.h24) ? Number(p.priceChange?.h24) : 0;
  let s = 0;
  if (liq >= 100_000) s += 30; else if (liq >= 25_000) s += 22; else if (liq >= 10_000) s += 12; else if (liq >= 5_000) s += 6;
  if (vol >= 500_000) s += 25; else if (vol >= 100_000) s += 18; else if (vol >= 25_000) s += 10; else if (vol >= 5_000) s += 5;
  if (transactions >= 20 && buyShare > 0.5) s += Math.min(15, Math.round((buyShare - 0.5) * 30));
  if (change > 0 && change < 100) s += 10; else if (change >= 100 && change < 200) s += 4;
  if (liq > 0 && (p.fdv ?? 0) > 0 && (p.fdv as number) / liq < 100) s += 10;
  if (volumeToLiquidity > 20) s -= 12; else if (volumeToLiquidity > 10) s -= 5;
  if (change > 200) s -= 8;
  if (change < -50) s -= 15;
  const hours = pairAgeHours(p.pairCreatedAt, now);
  if (hours !== null && hours < 2) s -= 15;
  return Math.max(0, Math.min(100, s));
}

export function riskFlags(p: PairLike, now = Date.now()): string[] {
  const { liq, vol, transactions, volumeToLiquidity, buyShare } = activityStats(p);
  const flags: string[] = [];
  if (liq < 25_000) flags.push("low liquidity");
  if (liq > 0 && volumeToLiquidity > 20) flags.push("very high volume/liquidity");
  if (transactions >= 200 && volumeToLiquidity > 15 && buyShare >= 0.45 && buyShare <= 0.55) flags.push("possible inorganic activity");
  const hours = pairAgeHours(p.pairCreatedAt, now);
  if (hours !== null && hours < 24) flags.push("very new pair");
  if ((p.priceChange?.h24 ?? 0) > 200) flags.push("extreme 24h move");
  if ((p.priceChange?.h24 ?? 0) < -50) flags.push("severe 24h drawdown");
  if ((p.fdv ?? 0) > 0 && liq > 0 && (p.fdv as number) / liq > 100) flags.push("high FDV/liquidity");
  if (vol > 0 && liq === 0) flags.push("missing liquidity data");
  return [...new Set(flags)].slice(0, 8);
}

export function researchScore(p: PairLike, socialScore = 0, now = Date.now()): number {
  const market = score(p, now);
  const social = Math.max(0, Math.min(100, socialScore));
  const riskPenalty = Math.min(20, riskFlags(p, now).length * 3);
  return Math.max(0, Math.min(100, Math.round(market * 0.9 + social * 0.1 - riskPenalty)));
}
