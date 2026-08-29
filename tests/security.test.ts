import { describe, expect, it } from "vitest";
import { isAuthorized, parseAllowedUserIds } from "../src/security/telegram-auth.js";
import { RateLimiter } from "../src/security/rate-limit.js";

describe("Telegram authorization", () => {
  it("fails closed without an allowlist", () => {
    expect(isAuthorized({ userId: 123, chatId: 456 }, new Set())).toBe(false);
  });

  it("requires both the user and optional chat boundary", () => {
    const allowed = new Set(["123"]);
    expect(isAuthorized({ userId: 123, chatId: 456 }, allowed, "456")).toBe(true);
    expect(isAuthorized({ userId: 123, chatId: 999 }, allowed, "456")).toBe(false);
    expect(isAuthorized({ userId: 999, chatId: 456 }, allowed, "456")).toBe(false);
  });

  it("rejects malformed allowlist entries", () => {
    expect([...parseAllowedUserIds("123, abc, 456 ")]).toEqual(["123", "456"]);
  });
});

describe("RateLimiter", () => {
  it("limits a key after the configured number of actions", () => {
    const limiter = new RateLimiter(10_000, 2);
    expect(limiter.isLimited("u", 100)).toBe(false);
    expect(limiter.isLimited("u", 101)).toBe(false);
    expect(limiter.isLimited("u", 102)).toBe(true);
    expect(limiter.isLimited("u", 10_101)).toBe(false);
  });
});
