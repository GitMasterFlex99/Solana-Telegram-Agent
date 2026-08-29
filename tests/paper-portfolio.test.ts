import { describe, expect, it } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PaperPortfolioManager } from "../src/core/paper-portfolio.js";

const signal = { address: "11111111111111111111111111111111", symbol: "TEST", entryPriceUsd: 2, opportunityScore: 80, riskProfile: "balanced", source: "test" };

async function manager() {
  const dir = await mkdtemp(join(tmpdir(), "paper-manager-"));
  return new PaperPortfolioManager({ startingBalanceUsd: 1000, positionSizeUsd: 100 }, join(dir, "portfolios.json"));
}

describe("paper portfolio manager", () => {
  it("keeps portfolios isolated per Telegram user", async () => {
    const m = await manager();
    expect((await m.open(1, signal, 1))?.costUsd).toBe(100);
    expect((await m.snapshot(1)).balanceUsd).toBe(900);
    expect((await m.snapshot(2)).balanceUsd).toBe(1000);
  });

  it("does not expose real trading capabilities", async () => {
    const m = await manager();
    const position = await m.open(1, signal, 1);
    expect(position?.id).toMatch(/^paper-/);
    expect((await m.snapshot(1)).positions[0]?.status).toBe("open");
  });

  it("can reset a simulated portfolio", async () => {
    const m = await manager();
    await m.open(1, signal, 1);
    await m.reset(1);
    expect((await m.snapshot(1)).balanceUsd).toBe(1000);
    expect((await m.snapshot(1)).positions).toEqual([]);
  });
});
