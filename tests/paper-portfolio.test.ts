import { describe, expect, it } from "vitest";
import { PaperPortfolioManager } from "../src/core/paper-portfolio.js";

const signal = { address: "11111111111111111111111111111111", symbol: "TEST", entryPriceUsd: 2, opportunityScore: 80, riskProfile: "balanced", source: "test" };

describe("paper portfolio manager", () => {
  it("keeps portfolios isolated per Telegram user", () => {
    const manager = new PaperPortfolioManager({ startingBalanceUsd: 1000, positionSizeUsd: 100 });
    expect(manager.open(1, signal, 1)?.costUsd).toBe(100);
    expect(manager.snapshot(1).balanceUsd).toBe(900);
    expect(manager.snapshot(2).balanceUsd).toBe(1000);
  });

  it("does not expose real trading capabilities", () => {
    const manager = new PaperPortfolioManager({ startingBalanceUsd: 1000, positionSizeUsd: 100 });
    const position = manager.open(1, signal, 1);
    expect(position?.id).toMatch(/^paper-/);
    expect(manager.snapshot(1).positions[0]?.status).toBe("open");
  });

  it("can reset a simulated portfolio", () => {
    const manager = new PaperPortfolioManager({ startingBalanceUsd: 1000, positionSizeUsd: 100 });
    manager.open(1, signal, 1);
    manager.reset(1);
    expect(manager.snapshot(1).balanceUsd).toBe(1000);
    expect(manager.snapshot(1).positions).toEqual([]);
  });
});
