import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { RiskProfile } from "../core/risk-profile.js";

const VALID = new Set<RiskProfile>(["conservative", "balanced", "aggressive"]);
type StoredProfiles = Record<string, RiskProfile>;

export class RiskProfileStore {
  private profiles: StoredProfiles = {};
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath = "data/risk-profiles.json") {}

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        this.profiles = Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, RiskProfile] => VALID.has(entry[1] as RiskProfile)));
      }
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
      if (code !== "ENOENT") throw error;
    }
    this.loaded = true;
  }

  async get(userId: number): Promise<RiskProfile> {
    await this.load();
    return this.profiles[String(userId)] ?? "balanced";
  }

  async set(userId: number, profile: RiskProfile): Promise<void> {
    if (!VALID.has(profile)) throw new Error("Invalid risk profile");
    await this.load();
    this.profiles[String(userId)] = profile;
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const tempPath = `${this.filePath}.tmp`;
      await writeFile(tempPath, `${JSON.stringify(this.profiles, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      await rename(tempPath, this.filePath);
    });
    await this.writeQueue;
  }
}
