import { strict as assert } from "node:assert";
import test from "node:test";
import { detectAlertEvents, snapshotFor } from "./alert-rules-v2.js";

test("alert rules only fire when thresholds are crossed", () => {
  const previous = snapshotFor({ opportunity: 70, momentum: 60, priceChange24h: 5, riskScore: 20 });
  const current = snapshotFor({ opportunity: 80, momentum: 75, priceChange24h: 25, riskScore: 80 });
  assert.deepEqual(detectAlertEvents(previous, current).map(x => x.type), ["momentum", "opportunity", "risk", "move"]);
});

test("first snapshot does not alert", () => {
  const current = snapshotFor({ opportunity: 90, momentum: 90, priceChange24h: 50 });
  assert.deepEqual(detectAlertEvents(undefined, current), []);
});
