import { describe, expect, it } from "vitest";
import { assessRisk } from "../src/core/risk.js";
import { validateQuoteRequest } from "../src/core/jupiter.js";

describe("market risk", () => {
  it("flags a new, illiquid pair", () => {
    const result = assessRisk({
      liquidityUsd: 5_000,
      volume24hUsd: 10_000,
      buys24h: 8,
      sells24h: 20,
      priceChange24h: 250,
      fdvUsd: 2_000_000,
      ageHours: 1,
    });
    expect(result.label).toBe("High");
    expect(result.flags).toContain("Very low liquidity");
    expect(result.flags).toContain("Very new pair");
  });

  it("does not treat a normal liquid market as high risk by default", () => {
    const result = assessRisk({
      liquidityUsd: 250_000,
      volume24hUsd: 500_000,
      buys24h: 1200,
      sells24h: 900,
      priceChange24h: 12,
      fdvUsd: 10_000_000,
      ageHours: 240,
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
  });
});

describe("Jupiter quote validation", () => {
  const validInput = {
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: "1000000",
  };

  it("accepts a valid request within the 1% slippage ceiling", () => {
    expect(() => validateQuoteRequest({ ...validInput, slippageBps: 100 })).not.toThrow();
  });

  it("rejects slippage above policy", () => {
    expect(() => validateQuoteRequest({ ...validInput, slippageBps: 101 })).toThrow("Slippage exceeds policy");
  });

  it("rejects invalid amounts", () => {
    expect(() => validateQuoteRequest({ ...validInput, amount: "0" })).toThrow("Invalid amount");
  });
});
