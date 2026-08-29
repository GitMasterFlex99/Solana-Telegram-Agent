export type MomentumSnapshot = {
  volume24hUsd: number;
  volumePrevious24hUsd: number | null;
  liquidityUsd: number;
  liquidityPreviousUsd: number | null;
  buys24h: number;
  sells24h: number;
  priceChange24h: number;
};

export type MomentumResult = {
  score: number;
  flags: string[];
  volumeChangePct: number | null;
  liquidityChangePct: number | null;
  buyPressure: number | null;
};

const pctChange = (current: number, previous: number | null): number | null => {
  if (previous === null || previous <= 0 || !Number.isFinite(current)) return null;
  return ((current - previous) / previous) * 100;
};

export function assessMomentum(snapshot: MomentumSnapshot): MomentumResult {
  let score = 50;
  const flags: string[] = [];
  const volumeChangePct = pctChange(snapshot.volume24hUsd, snapshot.volumePrevious24hUsd);
  const liquidityChangePct = pctChange(snapshot.liquidityUsd, snapshot.liquidityPreviousUsd);
  const totalTrades = snapshot.buys24h + snapshot.sells24h;
  const buyPressure = totalTrades > 0 ? snapshot.buys24h / totalTrades : null;

  if (volumeChangePct !== null) {
    if (volumeChangePct >= 100) { score += 20; flags.push("Volume has more than doubled"); }
    else if (volumeChangePct >= 50) { score += 12; flags.push("Volume is accelerating"); }
    else if (volumeChangePct <= -50) { score -= 12; flags.push("Volume is falling sharply"); }
  }

  if (buyPressure !== null) {
    if (buyPressure >= 0.65) { score += 12; flags.push("Buy pressure is elevated"); }
    else if (buyPressure <= 0.35) { score -= 12; flags.push("Sell pressure is elevated"); }
  }

  if (liquidityChangePct !== null) {
    if (liquidityChangePct >= 25) { score += 8; flags.push("Liquidity is increasing"); }
    else if (liquidityChangePct <= -25) { score -= 18; flags.push("Liquidity is falling"); }
  }

  if (snapshot.priceChange24h >= 100) { score -= 8; flags.push("Price has already moved more than 100% in 24h"); }
  else if (snapshot.priceChange24h >= 50) { score -= 3; flags.push("Price has already moved sharply"); }

  return {
    score: Math.max(0, Math.min(100, score)),
    flags,
    volumeChangePct,
    liquidityChangePct,
    buyPressure,
  };
}
