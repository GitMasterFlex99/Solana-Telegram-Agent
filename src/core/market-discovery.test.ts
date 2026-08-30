import { strict as assert } from "node:assert";
import test from "node:test";
import { discoverCandidates } from "./market-discovery.js";

const now = Date.UTC(2026, 0, 1);
const SOL_MINT = "So11111111111111111111111111111111111111112";

test("discovery keeps Solana pairs with enough liquidity and volume", () => {
  const pairs = [
    { chainId: "solana", baseToken: { address: "A" }, liquidity: { usd: 20_000 }, volume: { h24: 20_000 } },
    { chainId: "ethereum", baseToken: { address: "B" }, liquidity: { usd: 200_000 }, volume: { h24: 200_000 } },
    { chainId: "solana", baseToken: { address: "C" }, liquidity: { usd: 5_000 }, volume: { h24: 50_000 } },
    { chainId: "solana", baseToken: { address: "D" }, liquidity: { usd: 20_000 }, volume: { h24: 5_000 } }
  ];
  assert.deepEqual(discoverCandidates(pairs, now).map(p => p.baseToken?.address), ["A"]);
});

test("discovery excludes native SOL from meme candidates", () => {
  const pairs = [
    { chainId: "solana", baseToken: { address: SOL_MINT, symbol: "SOL" }, liquidity: { usd: 100_000_000 }, volume: { h24: 100_000_000 } },
    { chainId: "solana", baseToken: { address: "MEME", symbol: "MEME" }, liquidity: { usd: 100_000 }, volume: { h24: 100_000 } }
  ];
  assert.deepEqual(discoverCandidates(pairs, now).map(p => p.baseToken?.address), ["MEME"]);
});

test("discovery rejects pairs younger than 15 minutes", () => {
  const pairs = [{ chainId: "solana", baseToken: { address: "NEW" }, liquidity: { usd: 50_000 }, volume: { h24: 50_000 }, pairCreatedAt: now - 10 * 60_000 }];
  assert.equal(discoverCandidates(pairs, now).length, 0);
});

test("discovery sorts candidates by volume", () => {
  const pairs = [
    { chainId: "solana", baseToken: { address: "A" }, liquidity: { usd: 20_000 }, volume: { h24: 20_000 } },
    { chainId: "solana", baseToken: { address: "B" }, liquidity: { usd: 20_000 }, volume: { h24: 50_000 } }
  ];
  assert.deepEqual(discoverCandidates(pairs, now).map(p => p.baseToken?.address), ["B", "A"]);
});

test("discovery keeps only the strongest pool for each token", () => {
  const pairs = [
    { chainId: "solana", baseToken: { address: "A" }, dexId: "dex-1", liquidity: { usd: 20_000 }, volume: { h24: 80_000 } },
    { chainId: "solana", baseToken: { address: "A" }, dexId: "dex-2", liquidity: { usd: 50_000 }, volume: { h24: 40_000 } },
    { chainId: "solana", baseToken: { address: "B" }, liquidity: { usd: 30_000 }, volume: { h24: 90_000 } }
  ];
  const result = discoverCandidates(pairs, now);
  assert.deepEqual(result.map(p => p.baseToken?.address), ["B", "A"]);
  assert.equal(result.find(p => p.baseToken?.address === "A")?.dexId, "dex-2");
});

test("discovery uses volume when pool liquidity is tied", () => {
  const pairs = [
    { chainId: "solana", baseToken: { address: "A" }, dexId: "low-volume", liquidity: { usd: 50_000 }, volume: { h24: 40_000 } },
    { chainId: "solana", baseToken: { address: "A" }, dexId: "high-volume", liquidity: { usd: 50_000 }, volume: { h24: 90_000 } }
  ];
  const result = discoverCandidates(pairs, now);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.dexId, "high-volume");
});

test("discovery ignores duplicate pools but keeps different tokens", () => {
  const pairs = [
    { chainId: "solana", baseToken: { address: "A" }, liquidity: { usd: 100_000 }, volume: { h24: 100_000 } },
    { chainId: "solana", baseToken: { address: "A" }, liquidity: { usd: 20_000 }, volume: { h24: 500_000 } },
    { chainId: "solana", baseToken: { address: "B" }, liquidity: { usd: 80_000 }, volume: { h24: 80_000 } }
  ];
  assert.deepEqual(discoverCandidates(pairs, now).map(p => p.baseToken?.address), ["A", "B"]);
});
