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
  const volumeToLiquidity = liq > 0 ? vol / liq : Number.POSITIVE_INFINITY;
  const buyShare = transactions > 0 ? buys / transactions : 0;
  return { liq, vol, buys, sells, transactions, volumeToLiquidity, buyShare };
}

export function score(p: PairLike, now = Date.now()): number {
  const { liq, vol, transactions, volumeToLiquidity, buyShare } = activityStats(p);
  const change = Number.isFinite(p.priceChange?.h24) ? Number(p.priceChange?.h24) : 0;
  let s = 0;

  // Reward usable liquidity, but avoid letting raw volume dominate it.
  if (liq >= 250_000) s += 30;
  else if (liq >= 100_000) s += 27;
  else if (liq >= 50_000) s += 22;
  else if (liq >= 25_000) s += 16;
  else if (liq >= 10_000) s += 8;
  else if (liq >= 5_000) s += 3;

  if (vol >= 500_000) s += 18;
  else if (vol >= 100_000) s += 14;
  else if (vol >= 25_000) s += 9;
  else if (vol >= 5_000) s += 4;

  // Healthy activity is preferable to extreme turnover relative to LP depth.
  if (volumeToLiquidity >= 1 && volumeToLiquidity <= 8) s += 10;
  else if (volumeToLiquidity > 8 && volumeToLiquidity <= 15) s += 4;
  else if (volumeToLiquidity > 15) s -= 8;
  else if (liq > 0 && volumeToLiquidity < 0.25) s -= 3;

  if (transactions >= 20 && buyShare > 0.5) {
    s += Math.min(10, Math.round((buyShare - 0.5) * 20));
  }

  // Moderate positive momentum is useful; extreme pumps are not treated as quality.
  if (change > 0 && change < 75) s += 10;
  else if (change >= 75 && change < 150) s += 5;
  else if (change >= 150 && change < 250) s -= 3;
  else if (change >= 250) s -= 10;
  else if (change <= -50) s -= 20;
  else if (change < -25) s -= 8;

  const fdvRatio = liq > 0 && (p.fdv ?? 0) > 0 ? (p.fdv as number) / liq : null;
  if (fdvRatio !== null) {
    if (fdvRatio < 20) s += 10;
    else if (fdvRatio < 50) s += 6;
    else if (fdvRatio < 100) s += 2;
    else if (fdvRatio > 250) s -= 10;
    else if (fdvRatio > 100) s -= 5;
  }

  const hours = pairAgeHours(p.pairCreatedAt, now);
  if (hours !== null && hours < 2) s -= 15;
  else if (hours !== null && hours < 6) s -= 8;

  return Math.max(0, Math.min(100, s));
}

export function riskFlags(p: PairLike, now = Date.now()): string[] {
  const { liq, vol, transactions, volumeToLiquidity, buyShare } = activityStats(p);
  const flags: string[] = [];
  const change = Number.isFinite(p.priceChange?.h24) ? Number(p.priceChange?.h24) : 0;

  if (liq < 10_000) flags.push("very low liquidity");
  else if (liq < 25_000) flags.push("low liquidity");
  if (liq > 0 && volumeToLiquidity > 20) flags.push("very high volume/liquidity");
  if (transactions >= 200 && volumeToLiquidity > 15 && buyShare >= 0.45 && buyShare <= 0.55) flags.push("possible inorganic activity");

  const hours = pairAgeHours(p.pairCreatedAt, now);
  if (hours !== null && hours < 6) flags.push("very new pair");
  else if (hours !== null && hours < 24) flags.push("new pair");

  if (change >= 250) flags.push("extreme 24h pump");
  else if (change >= 150) flags.push("large 24h move");
  if (change <= -75) flags.push("severe 24h drawdown");
  else if (change <= -50) flags.push("heavy 24h drawdown");

  if ((p.fdv ?? 0) > 0 && liq > 0) {
    const ratio = (p.fdv as number) / liq;
    if (ratio > 250) flags.push("extreme FDV/liquidity");
    else if (ratio > 100) flags.push("high FDV/liquidity");
  }
  if (vol > 0 && liq === 0) flags.push("missing liquidity data");

  return [...new Set(flags)].slice(0, 8);
}

export function researchScore(p: PairLike, socialScore = 0, now = Date.now()): number {
  const market = score(p, now);
  const social = Math.max(0, Math.min(100, socialScore));
  const flags = riskFlags(p, now);
  const criticalRisk = flags.some(flag => [
    "very low liquidity",
    "severe 24h drawdown",
    "extreme 24h pump",
    "extreme FDV/liquidity",
    "missing liquidity data"
  ].includes(flag));
  if (criticalRisk) return Math.min(35, Math.max(0, Math.round(market * 0.85 + social * 0.05)));
  const riskPenalty = Math.min(25, flags.length * 4);
  return Math.max(0, Math.min(100, Math.round(market * 0.88 + social * 0.12 - riskPenalty)));
}
