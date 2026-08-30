import { strict as assert } from "node:assert";
import test from "node:test";
import { fetchSolanaPairs } from "./market-discovery.js";

const SOL = "So11111111111111111111111111111111111111112";
const TOKEN = "11111111111111111111111111111111";

test("live discovery builds Solana pairs from token profiles", async () => {
  const calls: string[] = [];
  const fetchImpl = async (input: Parameters<typeof fetch>[0]) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("token-profiles/latest/v1")) {
      return new Response(JSON.stringify([
        { chainId: "solana", tokenAddress: SOL },
        { chainId: "solana", tokenAddress: TOKEN },
        { chainId: "ethereum", tokenAddress: "0x123" }
      ]), { status: 200 });
    }
    if (url.includes(`/token-pairs/v1/solana/${TOKEN}`)) {
      return new Response(JSON.stringify([
        { chainId: "solana", baseToken: { address: TOKEN, symbol: "TEST" }, liquidity: { usd: 50000 }, volume: { h24: 75000 } }
      ]), { status: 200 });
    }
    throw new Error(`unexpected request: ${url}`);
  };

  const pairs = await fetchSolanaPairs(fetchImpl);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0]?.baseToken?.symbol, "TEST");
  assert.equal(calls.some(url => url.includes("/token-pairs/v1/solana/") && url.includes(SOL)), false);
});
