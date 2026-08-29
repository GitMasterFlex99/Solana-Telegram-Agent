import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AlertStateStore } from "../src/core/alert-state-store.js";

describe("alert state store", () => {
  it("persists snapshots across instances", async () => {
    const dir = await mkdtemp(join(tmpdir(), "alert-state-"));
    const file = join(dir, "state.json");
    const snapshot = { opportunity: 71, momentum: 68, priceChange24h: 12 };
    await new AlertStateStore(file).set("42:mint", snapshot);
    expect(await new AlertStateStore(file).get("42:mint")).toEqual(snapshot);
    const raw = await readFile(file, "utf8");
    expect(JSON.parse(raw)["42:mint"]).toEqual(snapshot);
  });
});
