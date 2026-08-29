import { describe, expect, it } from "vitest";
import { PaperTrader } from "../src/core/paper-trader.js";

const signal = { address: "11111111111111111111111111111111", symbol: "TEST", entryPriceUsd: 2, opportunityScore: 80, riskProfile: "balanced", source: "dexscreener" };

describe("paper trader", () => {
  it("opens a position and calculates equity without real trading", () => {
    const trader = new PaperTrader({ startingBalanceUsd: 1000, positionSizeUsd: 100 });
    const position = trader.open(signal, 1000);
    expect(position?.quantity).toBe(50);
    expect(trader.snapshot().balanceUsd).toBe(900);
    expect(trader.snapshot().equityUsd).toBe(1000);
  });

  it("takes profit and realizes P&L", () => {
    const trader = new PaperTrader({ startingBalanceUsd: 1000, positionSizeUsd: 100, takeProfitPct: 20 });
    const position = trader.open(signal, 1000)!;
    const closed = trader.update(position.id, 2.4, 2000)!;
    expect(closed.status).toBe("closed");
    expect(closed.exitReason).toBe("take-profit");
    expect(closed.realizedPnlUsd).toBeCloseTo(20);
    expect(trader.snapshot().realizedPnlUsd).toBeCloseTo(20);
  });

  it("stops loss at the configured threshold", () => {
    const trader = new PaperTrader({ startingBalanceUsd: 1000, positionSizeUsd: 100, stopLossPct: 10 });
    const position = trader.open(signal)!;
    const closed = trader.update(position.id, 1.8)!;
    expect(closed?.exitReason).toBe("stop-loss");
    expect(closed?.realizedPnlUsd).toBeCloseTo(-10);
  });

  it("rejects duplicate positions and invalid prices", () => {
    const trader = new PaperTrader({ startingBalanceUsd: 1000, positionSizeUsd: 100 });
    const first = trader.open(signal);
    expect(first).not.toBeNull();
    expect(trader.open(signal)).toBeNull();
    expect(trader.update(first!.id, 0)).toBeNull();
  });
});
