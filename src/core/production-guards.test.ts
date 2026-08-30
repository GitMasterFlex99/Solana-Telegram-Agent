import { strict as assert } from "node:assert";
import test from "node:test";
import { validateProductionConfig } from "./production-guards.js";

test("production config accepts required values", () => {
  assert.deepEqual(validateProductionConfig({
    telegramToken: "token",
    telegramChatId: "123456",
    aiEncryptionKey: Buffer.alloc(32, 7).toString("base64"),
  }), []);
});

test("production config reports missing and malformed values", () => {
  assert.deepEqual(validateProductionConfig({
    telegramChatId: "not-a-chat-id",
    aiEncryptionKey: "short",
  }), [
    "TELEGRAM_BOT_TOKEN is required",
    "TELEGRAM_CHAT_ID must be a numeric Telegram chat ID",
    "AI_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key when configured",
  ]);
});
