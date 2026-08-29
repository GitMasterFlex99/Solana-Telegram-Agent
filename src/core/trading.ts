export type TradeIntent = {
  inputMint: string;
  outputMint: string;
  amountLamports: bigint;
  slippageBps: number;
};

export type TradePreview = {
  inputAmount: string;
  expectedOutput: string;
  slippageBps: number;
  estimatedFeeLamports?: string;
  destination: string;
  requiresWalletSignature: true;
};

/**
 * This module intentionally does not sign or submit transactions.
 * A future Jupiter adapter should return a serialized transaction only after
 * validating the mints, amount and slippage. The user's wallet remains the
 * sole signer.
 */
export function validateTradeIntent(intent: TradeIntent): void {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(intent.inputMint)) throw new Error("Invalid input mint");
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(intent.outputMint)) throw new Error("Invalid output mint");
  if (intent.amountLamports <= 0n) throw new Error("Trade amount must be positive");
  if (intent.slippageBps < 1 || intent.slippageBps > 1000) throw new Error("Slippage outside safe UI bounds");
}
