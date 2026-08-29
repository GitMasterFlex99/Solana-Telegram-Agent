import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WatchlistStore } from "../src/core/watchlist-store.js";

const MINT = "11111111111111111111111111111111";

describe("watchlist store", () => {
  it("persists, deduplicates and removes entries", async () => {
    const dir = await mkdtemp(join(tmpdir(), "watchlist-"));
    const file = join(dir, "watchlists.json");
    const first = new WatchlistStore(file);
    expect(await first.add(123, MINT, "TEST")).toBe(true);
    expect(await first.add(123, MINT, "TEST")).toBe(false);
    const second = new WatchlistStore(file);
    const items = await second.list(123);
    expect(items).toHaveLength(1);
    expect(items[0]?.label).toBe("TEST");
    expect(await second.remove(123, MINT)).toBe(true);
    expect(await second.list(123)).toEqual([]);
    const raw = await readFile(file, "utf8");
    expect(raw).not.toContain("private");
  });

  it("ignores malformed persisted records", async () => {
    const dir = await mkdtemp(join(tmpdir(), "watchlist-invalid-"));
    const file = join(dir, "watchlists.json");
    await writeFile(file, JSON.stringify({
      "123": [
        { address: MINT, label: "valid", addedAt: Date.now() },
        { address: "not-a-solana-address", label: "bad", addedAt: Date.now() },
        { address: MINT, label: "duplicate", addedAt: Date.now() },
        { address: MINT, label: 42, addedAt: Date.now() },
      ],
      invalidUser: [{ address: MINT, addedAt: Date.now() }],
    }));
    const store = new WatchlistStore(file);
    expect(await store.list(123)).toHaveLength(1);
    expect(await store.list(123)).toEqual(expect.arrayContaining([expect.objectContaining({ address: MINT, label: "duplicate" })]));
    expect(await store.userIds()).toEqual([123]);
  });
});
