import assert from "node:assert/strict";
import test from "node:test";
import { socialSignal } from "./social-signals.js";

test("independent early mentions improve the social signal", () => {
  const now = 1_000_000;
  const result = socialSignal([
    { account: "AlphaA", mentionedAt: now - 10 * 60_000, hasEvidence: true },
    { account: "AlphaB", mentionedAt: now - 20 * 60_000, hasEvidence: true }
  ], now);
  assert.equal(result.independentAccounts, 2);
  assert.ok(result.score >= 50);
});

test("late mentions without evidence are penalized", () => {
  const now = 1_000_000;
  const result = socialSignal([
    { account: "Shiller", mentionedAt: now - 2 * 60 * 60_000, priceAtMention: 1, priceAfter: 1.4 }
  ], now);
  assert.equal(result.lateMentions, 1);
  assert.ok(result.score <= 5);
  assert.equal(result.summary, "Mostly late/hype-style mentions");
});

test("promotional and repeated mentions weaken social confidence", () => {
  const now = 1_000_000;
  const result = socialSignal([
    { account: "A", mentionedAt: now - 10 * 60_000, text: "100x gem buy now" },
    { account: "B", mentionedAt: now - 12 * 60_000, text: "100x gem buy now" },
    { account: "C", mentionedAt: now - 14 * 60_000, text: "100x gem buy now" },
    { account: "D", mentionedAt: now - 16 * 60_000, text: "100x gem buy now" }
  ], now);
  assert.equal(result.promotionalMentions, 4);
  assert.equal(result.credibleAccounts, 0);
  assert.ok(result.score <= 30);
  assert.match(result.summary, /promotional|repeated/i);
});
