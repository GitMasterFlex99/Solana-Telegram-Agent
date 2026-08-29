import { strict as assert } from "node:assert";
import { formatTwitterAccount, parseTwitterAccount } from "./twitter-link.js";

assert.deepEqual(parseTwitterAccount("@example_user"), { handle: "example_user", url: "https://x.com/example_user" });
assert.deepEqual(parseTwitterAccount("https://twitter.com/example_user/"), { handle: "example_user", url: "https://x.com/example_user" });
assert.equal(parseTwitterAccount("not a valid account!"), null);
assert.equal(formatTwitterAccount({ handle: "example_user", url: "https://x.com/example_user" }), "@example_user — https://x.com/example_user");

console.log("twitter link tests passed");
