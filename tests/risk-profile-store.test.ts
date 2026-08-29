import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RiskProfileStore } from "../src/security/risk-profile-store.js";

describe("risk profile store", () => {
  it("defaults to balanced and persists changes across instances", async () => {
    const dir = await mkdtemp(join(tmpdir(), "risk-profile-"));
    const file = join(dir, "profiles.json");
    const first = new RiskProfileStore(file);
    expect(await first.get(42)).toBe("balanced");
    await first.set(42, "aggressive");
    const second = new RiskProfileStore(file);
    expect(await second.get(42)).toBe("aggressive");
  });

  it("ignores malformed profile values", async () => {
    const dir = await mkdtemp(join(tmpdir(), "risk-profile-"));
    const file = join(dir, "profiles.json");
    await (await import("node:fs/promises")).writeFile(file, JSON.stringify({ "42": "unsafe", "7": "conservative" }));
    const store = new RiskProfileStore(file);
    expect(await store.get(42)).toBe("balanced");
    expect(await store.get(7)).toBe("conservative");
  });

  it("writes valid JSON without exposing unrelated process data", async () => {
    const dir = await mkdtemp(join(tmpdir(), "risk-profile-"));
    const file = join(dir, "profiles.json");
    const store = new RiskProfileStore(file);
    await store.set(99, "conservative");
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual({ "99": "conservative" });
  });
});
