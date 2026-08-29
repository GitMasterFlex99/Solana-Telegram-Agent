import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AlertSnapshot } from "./alert-rules.js";

export type AlertState = Record<string, AlertSnapshot>;

export class AlertStateStore {
  private data: AlertState = {};
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();
  constructor(private readonly file = "data/alert-state.json") {}
  private async load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const parsed = JSON.parse(await readFile(this.file, "utf8")) as unknown;
      if (parsed && typeof parsed === "object") this.data = parsed as AlertState;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  async get(key: string): Promise<AlertSnapshot | undefined> { await this.load(); return this.data[key]; }
  async set(key: string, snapshot: AlertSnapshot): Promise<void> {
    await this.load();
    this.data[key] = snapshot;
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, JSON.stringify(this.data, null, 2) + "\n", { mode: 0o600 });
      await rename(tmp, this.file);
    });
    return this.writeQueue;
  }
}
