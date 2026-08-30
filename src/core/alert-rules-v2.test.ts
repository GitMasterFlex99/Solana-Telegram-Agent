import { strict as assert } from "node:assert";
import test from "node:test";
import { detectAlertEvents, snapshotFor } from "./alert-rules-v2.js";

test("alert rules fire on meaningful threshold crossings", () => {
  const previous = snapshotFor({ opportunity: 65, momentum: 60, priceChange24h: 5, riskScore: 20 });
  const current = snapshotFor({ opportunity: 80, momentum: 75, priceChange24h: 25, riskScore: 80 });
  assert.deepEqual(detectAlertEvents(previous, current).map(x => x.type), ["momentum", "opportunity", "risk", "move"]);
});

test("hysteresis prevents alerts from threshold jitter", () => {
  const previous = snapshotFor({ opportunity: 74, momentum: 69, priceChange24h: 19, riskScore: 59 });
  const current = snapshotFor({ opportunity: 75, momentum: 70, priceChange24h: 20, riskScore: 60 });
  assert.deepEqual(detectAlertEvents(previous, current), []);
});

test("first snapshot does not alert", () => {
  const current = snapshotFor({ opportunity: 90, momentum: 90, priceChange24h: 50 });
  assert.deepEqual(detectAlertEvents(undefined, current), []);
});
