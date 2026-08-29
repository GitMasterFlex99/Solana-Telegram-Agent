import { assessPumpfunSignal, type PumpfunCoin, type PumpfunSignal } from "./pumpfun.js";

export type PumpfunScannerResult = PumpfunCoin & { pumpfunSignal: PumpfunSignal; opportunityScore: number };

export function rankPumpfunCoins(coins: PumpfunCoin[], limit = 10, now = Date.now()): PumpfunScannerResult[] {
  return coins
    .map((coin) => {
      const signal = assessPumpfunSignal(coin, now);
      const ageHours = Math.max(0, (now - coin.createdAt) / 3_600_000);
      let score = signal.score;
      if (coin.stage === "bonding-curve" && ageHours <= 6) score += 8;
      if (coin.mayhemMode) score -= 10;
      return { ...coin, pumpfunSignal: signal, opportunityScore: Math.max(0, Math.min(100, score)) };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, limit);
}
