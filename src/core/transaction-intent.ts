import { randomUUID, createHash } from "node:crypto";

export type TransactionIntent = {
  id: string;
  wallet: string;
  chain: "solana:mainnet" | "solana:devnet";
  action: "buy" | "sell";
  inputMint: string;
  outputMint: string;
  amountAtomic: bigint;
  slippageBps: number;
  expiresAt: number;
  policyVersion: string;
  consumed: boolean;
};

const MAX_SLIPPAGE_BPS = 100;
const MAX_LIFETIME_MS = 60_000;
const MAX_AMOUNT_ATOMIC = 10_000_000_000n;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function createTransactionIntent(input: Omit<TransactionIntent, "id" | "expiresAt" | "consumed">): TransactionIntent {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.wallet)) throw new Error("Invalid wallet address");
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.inputMint)) throw new Error("Invalid input mint");
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.outputMint)) throw new Error("Invalid output mint");
  if (input.amountAtomic <= 0n || input.amountAtomic > MAX_AMOUNT_ATOMIC) throw new Error("Invalid trade amount");
  if (!Number.isInteger(input.slippageBps) || input.slippageBps < 0 || input.slippageBps > MAX_SLIPPAGE_BPS) throw new Error("Invalid slippage");

  return { ...input, id: randomUUID(), expiresAt: Date.now() + MAX_LIFETIME_MS, consumed: false };
}

export function intentFingerprint(intent: TransactionIntent): string {
  return sha256([
    intent.id, intent.wallet, intent.chain, intent.action,
    intent.inputMint, intent.outputMint, intent.amountAtomic.toString(),
    intent.slippageBps, intent.expiresAt, intent.policyVersion,
  ].join("|"));
}

export function validateIntent(intent: TransactionIntent, connectedWallet: string, now = Date.now()): void {
  if (intent.consumed) throw new Error("Transaction intent already used");
  if (intent.wallet !== connectedWallet) throw new Error("Wallet does not match transaction intent");
  if (intent.chain !== "solana:devnet") throw new Error("Mainnet execution is disabled");
  if (intent.expiresAt <= now || intent.expiresAt > now + MAX_LIFETIME_MS) throw new Error("Transaction intent expired");
  if (intent.slippageBps > MAX_SLIPPAGE_BPS) throw new Error("Slippage exceeds policy");
}

export function consumeIntent(intent: TransactionIntent, connectedWallet: string, now = Date.now()): TransactionIntent {
  validateIntent(intent, connectedWallet, now);
  return { ...intent, consumed: true };
}
