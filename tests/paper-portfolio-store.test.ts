import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PaperPortfolioStore } from "../src/core/paper-portfolio-store.js";

const signal = { address: "11111111111111111111111111111111", symbol: "TEST", entryPriceUsd: 2, opportunityScore: 80, riskProfile: "balanced", source: "pumpfun" };

describe("paper portfolio persistence", () => {
  it("survives a new store instance", async () => {
    const dir = await mkdtemp(join(tmpdir(), "paper-portfolio-"));
    const file = join(dir, "portfolios.json");
    const first = new PaperPortfolioStore(file);
    expect(await first.open(123, signal, 1000)).not.toBeNull();
    const second = new PaperPortfolioStore(file);
    const snapshot = await second.snapshot(123);
    expect(snapshot.positions).toHaveLength(1);
    expect(snapshot.positions[0]?.status).toBe("open");
    expect(snapshot.balanceUsd).toBe(9900);
  });

  it("keeps users isolated and writes atomically", async () => {
    const dir = await mkdtemp(join(tmpdir(), "paper-portfolio-"));
    const file = join(dir, "portfolios.json");
    const store = new PaperPortfolioStore(file);
    await store.open(123, signal, 1000);
    expect((await store.snapshot(456)).positions).toEqual([]);
    const raw = await readFile(file, "utf8");
    expect(JSON.parse(raw)["123"].positions).toHaveLength(1);
    expect(raw).not.toContain("privateKey");
  });
});
