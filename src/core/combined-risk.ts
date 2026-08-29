import type { OnchainSafety } from "./onchain-safety.js";
import { assessRisk, type MarketSnapshot, type RiskResult } from "./risk.js";

export type CombinedRiskResult = RiskResult & {
  market: RiskResult;
  onchainScore: number;
  onchainFlags: string[];
  hardWarnings: string[];
};

export function assessCombinedRisk(market: MarketSnapshot, onchain: OnchainSafety): CombinedRiskResult {
  const marketRisk = assessRisk(market);
  const onchainFlags = [...onchain.flags];
  let onchainScore = 100;
  const hardWarnings: string[] = [];

  if (onchain.mintAuthorityActive === true) { onchainScore -= 15; hardWarnings.push("Mint authority is active"); }
  if (onchain.freezeAuthorityActive === true) { onchainScore -= 15; hardWarnings.push("Freeze authority is active"); }
  if (onchain.topHolderPercent !== null && onchain.topHolderPercent >= 20) { onchainScore -= 20; hardWarnings.push("Top holder concentration is very high"); }
  else if (onchain.topHolderPercent !== null && onchain.topHolderPercent >= 10) onchainScore -= 10;
  else if (onchain.topHolderPercent === null) hardWarnings.push("Holder concentration could not be verified");
  if (onchain.top5HolderPercent !== null && onchain.top5HolderPercent >= 50) { onchainScore -= 20; hardWarnings.push("Top-five holder concentration is very high"); }
  if (onchain.tokenProgram === "unknown") { onchainScore -= 25; hardWarnings.push("Token program could not be verified"); }

  // Token-2022 is legitimate, but extensions can materially change token behavior.
  // Keep this as a review signal; individual extension findings are scored below.
  if (onchain.tokenProgram === "token-2022") onchainScore -= 2;
  const extensionFlags = onchainFlags.filter((flag) => flag.startsWith("Token-2022 extension:"));
  for (const flag of extensionFlags) {
    if (flag.includes("PermanentDelegate") || flag.includes("Pausable") || flag.includes("TransferHook")) onchainScore -= 12;
    else if (flag.includes("DefaultAccountState") || flag.includes("TransferFeeConfig") || flag.includes("MintCloseAuthority")) onchainScore -= 7;
    else onchainScore -= 3;
  }

  onchainScore = Math.max(0, Math.min(100, onchainScore));
  const score = Math.max(0, Math.min(100, Math.round((marketRisk.score * 0.55) + (onchainScore * 0.45))));
  const label = score >= 70 ? "Low" : score >= 45 ? "Medium" : "High";
  return { score, label, flags: [...marketRisk.flags, ...onchainFlags], market: marketRisk, onchainScore, onchainFlags, hardWarnings };
}
