import { describe, expect, it } from "vitest";
import { consumeIntent, createTransactionIntent, validateIntent } from "../src/core/transaction-intent.js";

const wallet = "11111111111111111111111111111111";
const mintA = "So11111111111111111111111111111111111111112";
const mintB = "11111111111111111111111111111112";

const makeIntent = () => createTransactionIntent({
  wallet,
  chain: "solana:devnet",
  action: "buy",
  inputMint: mintA,
  outputMint: mintB,
  amountAtomic: 1_000_000n,
  slippageBps: 50,
  policyVersion: "devnet-v1",
});

describe("transaction intent", () => {
  it("binds the intent to the wallet", () => {
    const intent = makeIntent();
    expect(() => validateIntent(intent, "11111111111111111111111111111113")).toThrow(/Wallet does not match/);
  });

  it("rejects mainnet execution", () => {
    const intent = makeIntent();
    const mainnet = { ...intent, chain: "solana:mainnet" as const };
    expect(() => validateIntent(mainnet, wallet)).toThrow(/Mainnet execution is disabled/);
  });

  it("rejects expired intents", () => {
    const intent = makeIntent();
    expect(() => validateIntent(intent, wallet, intent.expiresAt + 1)).toThrow(/expired/);
  });

  it("cannot be consumed twice", () => {
    const intent = makeIntent();
    const consumed = consumeIntent(intent, wallet);
    expect(() => consumeIntent(consumed, wallet)).toThrow(/already used/);
  });

  it("rejects excessive slippage", () => {
    expect(() => createTransactionIntent({
      ...makeIntent(),
      id: undefined as never,
      expiresAt: undefined as never,
      consumed: undefined as never,
      slippageBps: 101,
    })).toThrow(/slippage/);
  });
});
