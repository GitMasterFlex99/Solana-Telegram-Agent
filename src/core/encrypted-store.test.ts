import { strict as assert } from "node:assert";
import { encryptSecret, decryptSecret, generateEncryptionKey } from "./encrypted-store.js";

const key = Buffer.alloc(32, 7);
const encrypted = encryptSecret("sk-example-secret", key);
assert.notEqual(encrypted, "sk-example-secret");
assert.equal(decryptSecret(encrypted, key), "sk-example-secret");
assert.notEqual(encryptSecret("sk-example-secret", key), encrypted);
assert.throws(() => decryptSecret(encrypted, Buffer.alloc(32, 8)));
assert.throws(() => decryptSecret(`${encrypted}x`, key));
assert.equal(Buffer.from(generateEncryptionKey(), "base64").length, 32);
console.log("encryption tests passed");
