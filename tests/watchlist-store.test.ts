import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WatchlistStore } from "../src/core/watchlist-store.js";

describe("watchlist store", () => {
  it("persists, deduplicates and removes entries", async () => {
    const dir = await mkdtemp(join(tmpdir(), "watchlist-"));
    const file = join(dir, "watchlists.json");
    const first = new WatchlistStore(file);
    expect(await first.add(123, "mint-a", "TEST")).toBe(true);
    expect(await first.add(123, "mint-a", "TEST")).toBe(false);
    const second = new WatchlistStore(file);
    expect(await second.list(123)).toHaveLength(1);
    expect(await second.list(123))[0].label = "TEST";
    expect(await second.remove(123, "mint-a")).toBe(true);
    expect(await second.list(123)).toEqual([]);
    const raw = await readFile(file, "utf8");
    expect(raw).not.toContain("private");
  });
});
