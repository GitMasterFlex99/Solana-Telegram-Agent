import type { OnchainSafety } from "./onchain-safety.js";
import { assessRisk, type MarketSnapshot, type RiskResult } from "./risk.js";

export type CombinedRiskResult = RiskResult & {
  market: RiskResult;
  onchainFlags: string[];
  hardWarnings: string[];
};

export function assessCombinedRisk(market: MarketSnapshot, onchain: OnchainSafety): CombinedRiskResult {
  const marketRisk = assessRisk(market);
  const onchainFlags = [...onchain.flags];
  let penalty = 0;
  const hardWarnings: string[] = [];

  if (onchain.mintAuthorityActive === true) {
    penalty += 15;
    hardWarnings.push("Mint authority is active");
  }
  if (onchain.freezeAuthorityActive === true) {
    penalty += 15;
    hardWarnings.push("Freeze authority is active");
  }
  if (onchain.topHolderPercent !== null && onchain.topHolderPercent >= 20) {
    penalty += 20;
    hardWarnings.push("Top holder concentration is very high");
  } else if (onchain.topHolderPercent !== null && onchain.topHolderPercent >= 10) {
    penalty += 10;
  }
  if (onchain.top5HolderPercent !== null && onchain.top5HolderPercent >= 50) {
    penalty += 20;
    hardWarnings.push("Top-five holder concentration is very high");
  }
  if (onchain.tokenProgram === "unknown") {
    penalty += 25;
    hardWarnings.push("Token program could not be verified");
  }
  if (onchain.tokenProgram === "token-2022") {
    penalty += 5;
  }

  const score = Math.max(0, Math.min(100, marketRisk.score - penalty));
  const label = score >= 70 ? "Low" : score >= 45 ? "Medium" : "High";
  return {
    score,
    label,
    flags: [...marketRisk.flags, ...onchainFlags],
    market: marketRisk,
    onchainFlags,
    hardWarnings,
  };
}
