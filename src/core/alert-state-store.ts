import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AlertSnapshot } from "./alert-rules-v2.js";

export type AlertState = Record<string, AlertSnapshot>;

function isSnapshot(value: unknown): value is AlertSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.opportunity === "number" && Number.isFinite(item.opportunity)
    && typeof item.momentum === "number" && Number.isFinite(item.momentum)
    && typeof item.priceChange24h === "number" && Number.isFinite(item.priceChange24h)
    && (item.riskScore === undefined || (typeof item.riskScore === "number" && Number.isFinite(item.riskScore)))
    && (item.liquidityUsd === undefined || (typeof item.liquidityUsd === "number" && Number.isFinite(item.liquidityUsd)))
    && (item.volume24hUsd === undefined || (typeof item.volume24hUsd === "number" && Number.isFinite(item.volume24hUsd)));
}

export class AlertStateStore {
  private data: AlertState = {};
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();
  constructor(private readonly file = "data/alert-state.json") {}

  private async load() {
    if (this.loaded) return;
    try {
      const parsed = JSON.parse(await readFile(this.file, "utf8")) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid alert state format");
      for (const [key, value] of Object.entries(parsed)) if (isSnapshot(value)) this.data[key] = value;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    } finally { this.loaded = true; }
  }

  async get(key: string): Promise<AlertSnapshot | undefined> { await this.load(); return this.data[key]; }

  async set(key: string, snapshot: AlertSnapshot): Promise<void> {
    await this.load();
    this.data[key] = snapshot;
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(this.data, null, 2) + "\n", { mode: 0o600 });
      await rename(tmp, this.file);
    });
    return this.writeQueue;
  }
}
