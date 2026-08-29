export type MarketSnapshot = {
  liquidityUsd: number;
  volume24hUsd: number;
  buys24h: number;
  sells24h: number;
  priceChange24h: number;
  fdvUsd: number;
  ageHours: number;
};

export type RiskResult = {
  score: number;
  label: "Low" | "Medium" | "High";
  flags: string[];
};

export function assessRisk(m: MarketSnapshot): RiskResult {
  const flags: string[] = [];
  let risk = 0;

  if (m.liquidityUsd < 10_000) { risk += 40; flags.push("Very low liquidity"); }
  else if (m.liquidityUsd < 25_000) { risk += 20; flags.push("Low liquidity"); }

  if (m.volume24hUsd < 10_000) { risk += 15; flags.push("Very low 24h volume"); }
  else if (m.volume24hUsd < 50_000) { risk += 7; flags.push("Low 24h volume"); }

  if (m.ageHours < 2) { risk += 30; flags.push("Very new pair"); }
  else if (m.ageHours < 12) { risk += 12; flags.push("New pair"); }

  if (m.priceChange24h >= 200) { risk += 25; flags.push("Extreme 24h move"); }
  else if (m.priceChange24h >= 100) { risk += 12; flags.push("Large 24h move"); }

  if (m.liquidityUsd > 0 && m.fdvUsd / m.liquidityUsd > 150) {
    risk += 15;
    flags.push("High FDV relative to liquidity");
  }

  const totalTx = m.buys24h + m.sells24h;
  if (totalTx > 50 && m.buys24h / totalTx < 0.25) {
    risk += 10;
    flags.push("Weak buy-side activity");
  }

  const score = Math.max(0, Math.min(100, 100 - risk));
  const label = score >= 70 ? "Low" : score >= 45 ? "Medium" : "High";
  return { score, label, flags };
}
