import type { PumpfunCoin, PumpfunSignal } from "./pumpfun.js";

export function pumpfunPresentation(coin: PumpfunCoin, signal: PumpfunSignal): string[] {
  const ageHours = Math.max(0, (Date.now() - coin.createdAt) / 3_600_000);
  const stage = coin.stage === "bonding-curve" ? "BONDING CURVE" : coin.stage === "pumpswap" ? "PUMPSWAP" : "UNKNOWN STAGE";
  const lines = [
    "Source: Pump.fun",
    `Stage: ${stage}`,
    `Age: ${ageHours < 24 ? `${ageHours.toFixed(1)}h` : `${(ageHours / 24).toFixed(1)}d`}`,
    `Market cap: $${coin.marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `Pump.fun signal: ${signal.score}/100`,
  ];
  if (coin.stage === "bonding-curve") lines.push("⚠️ Early-stage coin: bonding-curve price impact and volatility can be extreme.");
  if (coin.mayhemMode) lines.push("⚠️ Mayhem Mode: Pump.fun says an autonomous agent may trade the coin during its first 24 hours.");
  if (coin.stage === "pumpswap") lines.push("✓ Graduated: Pump.fun says bonding-curve liquidity has migrated to PumpSwap.");
  return lines;
}
