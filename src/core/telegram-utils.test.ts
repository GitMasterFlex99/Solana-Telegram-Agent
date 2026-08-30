import { strict as assert } from "node:assert";
import test from "node:test";
import { createCooldown, escapeHtml } from "./telegram-utils.js";

test("escapeHtml protects Telegram HTML text", () => {
  assert.equal(escapeHtml(`<script>alert("x")</script> & 'x'`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;x&#39;");
});

test("escapeHtml handles missing values", () => {
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(null), "");
});

test("cooldown rejects rapid repeated requests per user", () => {
  const cooldown = createCooldown(10_000);
  assert.equal(cooldown.check(1, 1_000), true);
  assert.equal(cooldown.check(1, 5_000), false);
  assert.equal(cooldown.check(2, 5_000), true);
  assert.equal(cooldown.check(1, 11_000), true);
});

test("cooldown can be cleared", () => {
  const cooldown = createCooldown(10_000);
  assert.equal(cooldown.check(1, 1_000), true);
  cooldown.clear(1);
  assert.equal(cooldown.check(1, 1_001), true);
});
