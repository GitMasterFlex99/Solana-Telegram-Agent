import { describe, expect, it } from "vitest";
import { detectAlert } from "../src/core/alert-rules.js";

describe("alert rules", () => {
  it("detects meaningful momentum and opportunity jumps", () => {
    expect(detectAlert({ opportunity: 50, momentum: 40, priceChange24h: 5 }, { opportunity: 70, momentum: 60, priceChange24h: 5 })).toEqual(["momentum_jump", "opportunity_jump"]);
  });
  it("detects large price moves", () => {
    expect(detectAlert({ opportunity: 50, momentum: 50, priceChange24h: 0 }, { opportunity: 50, momentum: 50, priceChange24h: 25 })).toEqual(["price_move"]);
  });
  it("detects worsening risk", () => {
    expect(detectAlert({ opportunity: 70, momentum: 70, priceChange24h: 5, riskScore: 80 }, { opportunity: 70, momentum: 70, priceChange24h: 5, riskScore: 60 })).toEqual(["risk_deteriorated"]);
  });
  it("does not alert on small changes", () => {
    expect(detectAlert({ opportunity: 50, momentum: 50, priceChange24h: 5 }, { opportunity: 60, momentum: 60, priceChange24h: 15 })).toEqual([]);
  });
});
