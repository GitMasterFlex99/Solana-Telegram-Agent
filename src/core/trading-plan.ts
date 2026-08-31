import type { DiscoveredPair } from "./market-discovery.js";

export type TradingPlan = {
  symbol: string;
  address: string;
  score: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  entry: number;
  stop: number;
  target1: number;
  target2: number;
  riskPercent: number;
  rewardRisk: number;
  invalidation: string;
  sources: Array<{ label: string; url: string }>;
};

export function buildTradingPlan(pair: DiscoveredPair, score: number, riskFlags: string[], accountUsd = 1000): TradingPlan {
  const price = Number(pair.priceUsd);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Token price is unavailable.");
  const momentum = pair.priceChange?.h24 ?? 0;
  const liquidity = pair.liquidity?.usd ?? 0;
  const risk: TradingPlan["risk"] = riskFlags.length >= 3 || liquidity < 10_000 ? "HIGH" : riskFlags.length >= 1 || liquidity < 50_000 ? "MEDIUM" : "LOW";

  const stopPct = risk === "HIGH" ? 0.12 : risk === "MEDIUM" ? 0.09 : 0.07;
  const entry = price;
  const stop = price * (1 - stopPct);
  const target1 = price * (1 + stopPct * 1.5);
  const target2 = price * (1 + stopPct * 2.5);
  const rewardRisk = (target1 - entry) / (entry - stop);

  return {
    symbol: pair.baseToken?.symbol ?? "UNKNOWN",
    address: pair.baseToken?.address ?? "",
    score,
    risk,
    entry,
    stop,
    target1,
    target2,
    riskPercent: Math.min(2, Math.max(0.25, score >= 75 ? 1.5 : score >= 60 ? 1 : 0.5)),
    rewardRisk,
    invalidation: momentum < -15 ? "Setup is invalidated if downside momentum persists or liquidity deteriorates materially." : "Setup is invalidated if price closes below the stop or market liquidity/volume collapses.",
    sources: [
      { label: "DexScreener market", url: pair.url ?? `https://dexscreener.com/solana/${pair.pairAddress ?? pair.baseToken?.address ?? ""}` },
      { label: "Solana token explorer", url: `https://solscan.io/token/${pair.baseToken?.address ?? ""}` },
    ],
  };
}

export function positionSizeUsd(plan: TradingPlan, accountUsd: number): number {
  if (!Number.isFinite(accountUsd) || accountUsd <= 0) throw new Error("Account size must be positive.");
  const riskBudget = accountUsd * (plan.riskPercent / 100);
  const lossPerDollar = (plan.entry - plan.stop) / plan.entry;
  return Math.max(0, riskBudget / lossPerDollar);
}
