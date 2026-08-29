export type TradeIntent = {
  inputMint: string;
  outputMint: string;
  amountAtomic: bigint;
  maxSlippageBps: number;
  createdAtMs: number;
  expiresAtMs: number;
};

export type ValidationResult = { ok: true } | { ok: false; reason: string };

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function validateTradeIntent(intent: TradeIntent, nowMs = Date.now()): ValidationResult {
  if (!BASE58.test(intent.inputMint) || !BASE58.test(intent.outputMint)) {
    return { ok: false, reason: "Invalid mint address" };
  }
  if (intent.inputMint === intent.outputMint) {
    return { ok: false, reason: "Input and output mints must differ" };
  }
  if (intent.amountAtomic <= 0n) {
    return { ok: false, reason: "Amount must be positive" };
  }
  if (!Number.isInteger(intent.maxSlippageBps) || intent.maxSlippageBps < 0 || intent.maxSlippageBps > 100) {
    return { ok: false, reason: "Slippage exceeds the 1% safety limit" };
  }
  if (intent.expiresAtMs <= intent.createdAtMs || intent.expiresAtMs - intent.createdAtMs > 60_000) {
    return { ok: false, reason: "Trade intent lifetime is invalid" };
  }
  if (nowMs > intent.expiresAtMs) {
    return { ok: false, reason: "Trade intent expired" };
  }
  return { ok: true };
}
