export type TransactionIntent = {
  wallet: string;
  tokenMint: string;
  spendLamports: bigint;
  slippageBps: number;
  expiresAtMs: number;
  allowedPrograms: string[];
  observedPrograms: string[];
};

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reasons: string[] };

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
const pubkeyLike = (value: string) => BASE58.test(value) && value.length >= 32 && value.length <= 44;

export function validateTransactionIntent(intent: TransactionIntent, nowMs = Date.now()): PolicyDecision {
  const reasons: string[] = [];

  if (!pubkeyLike(intent.wallet)) reasons.push("Invalid wallet address");
  if (!pubkeyLike(intent.tokenMint)) reasons.push("Invalid token mint");
  if (intent.spendLamports <= 0n) reasons.push("Spend must be positive");
  if (intent.slippageBps < 0 || intent.slippageBps > 300) reasons.push("Slippage exceeds policy limit");
  if (intent.expiresAtMs <= nowMs) reasons.push("Transaction intent expired");
  if (intent.expiresAtMs - nowMs > 120_000) reasons.push("Transaction intent lifetime is too long");

  const allowed = new Set(intent.allowedPrograms);
  for (const program of intent.observedPrograms) {
    if (!allowed.has(program)) reasons.push(`Unexpected program: ${program}`);
  }

  return reasons.length ? { allowed: false, reasons } : { allowed: true };
}
