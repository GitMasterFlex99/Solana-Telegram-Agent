import { strict as assert } from "node:assert";
import test from "node:test";
import { pairAgeHours, researchScore, riskFlags, score } from "./scoring.js";

const now = Date.UTC(2026, 0, 1);

test("pairAgeHours calculates age", () => {
  assert.equal(pairAgeHours(now - 3_600_000, now), 1);
  assert.equal(pairAgeHours(undefined, now), null);
});

test("score stays within 0-100", () => {
  assert.ok(score({}, now) >= 0);
  assert.ok(score({ liquidity: { usd: 1_000_000 }, volume: { h24: 2_000_000 }, txns: { h24: { buys: 100, sells: 10 } }, priceChange: { h24: 20 }, fdv: 10_000_000 }, now) <= 100);
});

test("new pairs receive a score penalty", () => {
  const oldPair = { liquidity: { usd: 100_000 }, volume: { h24: 500_000 }, priceChange: { h24: 20 }, pairCreatedAt: now - 24 * 3_600_000 };
  const newPair = { ...oldPair, pairCreatedAt: now - 30 * 60_000 };
  assert.ok(score(newPair, now) < score(oldPair, now));
});

test("high turnover relative to liquidity lowers market quality", () => {
  const normal = { liquidity: { usd: 100_000 }, volume: { h24: 500_000 }, priceChange: { h24: 20 } };
  const extreme = { ...normal, volume: { h24: 2_500_000 } };
  assert.ok(score(extreme, now) < score(normal, now));
});

test("severe drawdown lowers market quality", () => {
  const stable = { liquidity: { usd: 100_000 }, volume: { h24: 100_000 }, priceChange: { h24: 10 } };
  const drawdown = { ...stable, priceChange: { h24: -60 } };
  assert.ok(score(drawdown, now) < score(stable, now));
});

test("risk flags detect basic hazards", () => {
  const flags = riskFlags({ liquidity: { usd: 5_000 }, volume: { h24: 200_000 }, priceChange: { h24: 250 }, pairCreatedAt: now - 2 * 3_600_000 }, now);
  assert.deepEqual(flags, ["very low liquidity", "very high volume/liquidity", "very new pair", "extreme 24h pump"]);
});

test("risk flags detect possible inorganic activity", () => {
  const flags = riskFlags({ liquidity: { usd: 50_000 }, volume: { h24: 800_000 }, txns: { h24: { buys: 210, sells: 190 } } }, now);
  assert.ok(flags.includes("possible inorganic activity"));
});

test("risk flags detect severe drawdowns", () => {
  const flags = riskFlags({ liquidity: { usd: 100_000 }, volume: { h24: 100_000 }, priceChange: { h24: -60 } }, now);
  assert.ok(flags.includes("heavy 24h drawdown"));
});

test("extreme risk caps the research score", () => {
  const dangerous = { liquidity: { usd: 5_000 }, volume: { h24: 500_000 }, priceChange: { h24: -80 } };
  assert.ok(researchScore(dangerous, 100, now) <= 35);
});

test("social signal remains a small influence for ordinary candidates", () => {
  const pair = { liquidity: { usd: 100_000 }, volume: { h24: 500_000 }, priceChange: { h24: 20 }, pairCreatedAt: now - 24 * 3_600_000 };
  const withoutSocial = researchScore(pair, 0, now);
  const withSocial = researchScore(pair, 100, now);
  assert.ok(withSocial >= withoutSocial);
  assert.ok(withSocial - withoutSocial <= 12);
});
