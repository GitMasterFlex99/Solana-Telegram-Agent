import { strict as assert } from "node:assert";
import test from "node:test";
import { mapWithConcurrency } from "./concurrency.js";

test("mapWithConcurrency preserves result order", async () => {
  const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    await new Promise(resolve => setTimeout(resolve, (5 - value) * 5));
    return value * 2;
  });
  assert.deepEqual(result, [2, 4, 6, 8]);
});

test("mapWithConcurrency respects the limit", async () => {
  let active = 0;
  let peak = 0;
  await mapWithConcurrency([1, 2, 3, 4, 5], 2, async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
  });
  assert.equal(peak, 2);
});

test("mapWithConcurrency rejects invalid limits", async () => {
  await assert.rejects(() => mapWithConcurrency([1], 0, async value => value));
});
