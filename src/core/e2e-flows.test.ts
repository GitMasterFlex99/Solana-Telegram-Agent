import { strict as assert } from "node:assert";
import test from "node:test";
import { WatchlistStore } from "./watchlist-store.js";
import { AlertStateStore } from "./alert-state-store.js";
import { detectAlertEvents, snapshotFor } from "./alert-rules-v2.js";
import { buildTokenPrompt } from "./ai.js";
import { tmpdir } from "node:os";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";

async function tempPath(name: string) {
  return join(await mkdtemp(join(tmpdir(), "solana-agent-")), name);
}

test("watchlist survives a fresh store instance", async () => {
  const file = await tempPath("watchlists.json");
  const first = new WatchlistStore(file);
  assert.equal(await first.add(123, "So11111111111111111111111111111111111111112", "SOL"), true);
  const second = new WatchlistStore(file);
  const items = await second.list(123);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.address, "So11111111111111111111111111111111111111112");
  assert.equal(items[0]?.label, "SOL");
  assert.equal(typeof items[0]?.addedAt, "number");
});

test("alert state survives a fresh store instance", async () => {
  const file = await tempPath("alert-state.json");
  const snapshot = snapshotFor({ opportunity: 80, momentum: 75, priceChange24h: 21, liquidityUsd: 100000, volume24hUsd: 250000 });
  const first = new AlertStateStore(file);
  await first.set("123:token", snapshot);
  const second = new AlertStateStore(file);
  assert.deepEqual(await second.get("123:token"), snapshot);
});

test("alert rules emit a meaningful threshold crossing", () => {
  const previous = snapshotFor({ opportunity: 60, momentum: 60, priceChange24h: 5, liquidityUsd: 100000, volume24hUsd: 100000 });
  const current = snapshotFor({ opportunity: 76, momentum: 72, priceChange24h: 22, liquidityUsd: 90000, volume24hUsd: 250000 });
  assert.deepEqual(detectAlertEvents(previous, current).map(x => x.type), ["momentum", "opportunity", "move", "volume"]);
});

test("AI prompt is evidence-bound", () => {
  const prompt = buildTokenPrompt({ symbol: "TEST", score: 72, riskFlags: ["low liquidity"], social: "60/100", marketContext: "liquidity=$50K" });
  assert.match(prompt, /using only the supplied evidence/i);
  assert.match(prompt, /Do not invent missing data/i);
  assert.match(prompt, /invalidation condition/i);
});

test("persistent files are created as JSON", async () => {
  const file = await tempPath("watchlists.json");
  const store = new WatchlistStore(file);
  await store.add(456, "So11111111111111111111111111111111111111112");
  const parsed = JSON.parse(await readFile(file, "utf8"));
  assert.equal(Array.isArray(parsed["456"]), true);
});
