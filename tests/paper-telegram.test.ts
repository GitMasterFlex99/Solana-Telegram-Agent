import { describe, expect, it } from "vitest";
import { PaperPortfolioManager } from "../src/core/paper-portfolio.js";
import { createPaperPortfolioUi, paperSignalFromPair, PAPER_MODE_LABEL } from "../src/core/paper-telegram.js";

describe("paper Telegram UI", () => {
  it("renders an explicitly simulation-only portfolio", () => {
    const manager = new PaperPortfolioManager();
    const ui = createPaperPortfolioUi(manager, () => undefined);
    expect(ui.text(123)).toContain(PAPER_MODE_LABEL);
    expect(ui.text(123)).toContain("NO REAL TRADES");
  });

  it("creates a safe signal from a scanned pair", () => {
    const pair = { baseToken: { address: "11111111111111111111111111111111", symbol: "TEST", name: "Test" }, priceUsd: "0.01", opportunityScore: 80, source: "pumpfun" } as any;
    expect(paperSignalFromPair(pair, "balanced")).toEqual(expect.objectContaining({ address: pair.baseToken.address, symbol: "TEST", entryPriceUsd: 0.01, riskProfile: "balanced", source: "pumpfun" }));
  });

  it("rejects missing or invalid prices", () => {
    const pair = { baseToken: { address: "11111111111111111111111111111111", symbol: "TEST" }, priceUsd: undefined, opportunityScore: 80, source: "pumpfun" } as any;
    expect(paperSignalFromPair(pair, "balanced")).toBeNull();
  });
});
