import { strict as assert } from "node:assert";
import { assessSocial } from "./social.js";

const early = assessSocial([
  { account: "a", tokenAddress: "x", ageMinutes: 10, hasEvidence: true },
  { account: "b", tokenAddress: "x", ageMinutes: 20, hasEvidence: true },
]);
assert.equal(early.label, "interesting");
assert.ok(early.score >= 65);

const late = assessSocial([
  { account: "a", tokenAddress: "x", ageMinutes: 90, hasEvidence: false, priceChangeBeforeMentionPct: 55 },
]);
assert.equal(late.label, "weak");
assert.ok(late.score < 35);

const empty = assessSocial([]);
assert.equal(empty.score, 0);
assert.equal(empty.label, "weak");

console.log("social tests passed");
