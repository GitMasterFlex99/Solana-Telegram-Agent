import { mkdir, readFile, rename, chmod, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { RiskProfile } from "./risk-profile.js";
import { parseRiskProfile } from "./risk-profile.js";

export class RiskProfileStore {
  private writeQueue: Promise<void> = Promise.resolve();
  constructor(private readonly filePath = "data/risk-profiles.json") {}

  async get(userId: number): Promise<RiskProfile> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const data = JSON.parse(raw) as Record<string, unknown>;
      return parseRiskProfile(typeof data[String(userId)] === "string" ? data[String(userId)] as string : undefined);
    } catch { return "balanced"; }
  }

  async set(userId: number, profile: RiskProfile): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(await readFile(this.filePath, "utf8")) as Record<string, unknown>; } catch {}
      data[String(userId)] = parseRiskProfile(profile);
      const dir = dirname(this.filePath);
      await mkdir(dir, { recursive: true });
      const temp = `${this.filePath}.${process.pid}.tmp`;
      await writeFile(temp, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
      await chmod(temp, 0o600);
      await rename(temp, this.filePath);
    });
    return this.writeQueue;
  }
}
