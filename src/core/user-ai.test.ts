import { strict as assert } from "node:assert";
import { createMemoryAIKeyStore, maskKey } from "./user-ai.js";

const store = createMemoryAIKeyStore();
assert.equal(store.has("1"), false);
store.set("1", "  sk-test  ");
assert.equal(store.get("1"), "sk-test");
assert.equal(store.has("1"), true);
assert.equal(maskKey(store.get("1")), "connected");
store.remove("1");
assert.equal(store.has("1"), false);
assert.equal(maskKey(undefined), "not connected");
console.log("user AI tests passed");
