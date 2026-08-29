import { strict as assert } from "node:assert";
import test from "node:test";
import { discoverCandidates } from "./market-discovery.js";

const now = Date.UTC(2026, 0, 1);

test("discovery keeps Solana pairs with enough liquidity and volume", () => {
  const pairs = [
    { chainId: "solana", baseToken: { address: "A" }, liquidity: { usd: 20_000 }, volume: { h24: 20_000 } },
    { chainId: "ethereum", baseToken: { address: "B" }, liquidity: { usd: 200_000 }, volume: { h24: 200_000 } },
    { chainId: "solana", baseToken: { address: "C" }, liquidity: { usd: 5_000 }, volume: { h24: 50_000 } },
    { chainId: "solana", baseToken: { address: "D" }, liquidity: { usd: 20_000 }, volume: { h24: 5_000 } }
  ];
  assert.deepEqual(discoverCandidates(pairs, now).map(p => p.baseToken?.address), ["A"]);
});

test("discovery rejects pairs younger than 15 minutes", () => {
  const pairs = [{ chainId: "solana", baseToken: { address: "NEW" }, liquidity: { usd: 50_000 }, volume: { h24: 50_000 }, pairCreatedAt: now - 10 * 60_000 }];
  assert.equal(discoverCandidates(pairs, now).length, 0);
});
