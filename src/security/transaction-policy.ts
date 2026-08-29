export type TransactionIntent = {
  network: "mainnet-beta";
  userWallet: string;
  inputMint: string;
  outputMint: string;
  amountAtomic: bigint;
  quotedOutputAtomic: bigint;
  slippageBps: number;
  allowedPrograms: string[];
  expiresAtMs: number;
};

export type PolicyDecision = { allowed: boolean; reasons: string[] };

const MAX_SLIPPAGE_BPS = 100; // 1%
const MAX_INTENT_LIFETIME_MS = 60_000;

export function evaluateTransactionIntent(intent: TransactionIntent, now = Date.now()): PolicyDecision {
  const reasons: string[] = [];
  if (!intent.userWallet || !intent.inputMint || !intent.outputMint) reasons.push("Missing transaction identity");
  if (intent.amountAtomic <= 0n || intent.quotedOutputAtomic <= 0n) reasons.push("Invalid amount");
  if (intent.slippageBps < 0 || intent.slippageBps > MAX_SLIPPAGE_BPS) reasons.push("Slippage exceeds safety limit");
  if (intent.expiresAtMs <= now || intent.expiresAtMs - now > MAX_INTENT_LIFETIME_MS) reasons.push("Transaction intent expired or too long-lived");
  if (!intent.allowedPrograms.length) reasons.push("No approved program set");
  if (intent.inputMint === intent.outputMint) reasons.push("Input and output token are identical");
  return { allowed: reasons.length === 0, reasons };
}
