import type { OnchainSafety } from "./onchain-safety.js";

export type OnchainRisk = {
  penalty: number;
  hardBlock: boolean;
  flags: string[];
};

export function evaluateOnchainRisk(safety: OnchainSafety): OnchainRisk {
  let penalty = 0;
  const flags = [...safety.flags];
  if (safety.mintAuthorityActive === true) penalty += 20;
  if (safety.freezeAuthorityActive === true) penalty += 20;
  if (safety.topHolderPercent !== null) {
    if (safety.topHolderPercent >= 20) penalty += 30;
    else if (safety.topHolderPercent >= 10) penalty += 15;
  }
  if (safety.top5HolderPercent !== null && safety.top5HolderPercent >= 50) penalty += 20;
  if (safety.tokenProgram === "unknown") penalty += 40;
  if (safety.tokenProgram === "token-2022") penalty += 5;
  const hardBlock = safety.tokenProgram === "unknown" || safety.mintAuthorityActive === null || safety.freezeAuthorityActive === null;
  return { penalty: Math.min(100, penalty), hardBlock, flags };
}
