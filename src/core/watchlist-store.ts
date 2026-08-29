import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type WatchItem = { address: string; label?: string; addedAt: number };
export type Watchlist = Record<string, WatchItem[]>;

const MAX_ITEMS_PER_USER = 50;
const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MAX_LABEL_LENGTH = 100;

function isValidWatchItem(value: unknown): value is WatchItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.address === "string" && ADDRESS_RE.test(item.address)
    && typeof item.addedAt === "number" && Number.isFinite(item.addedAt)
    && (item.label === undefined || (typeof item.label === "string" && item.label.length <= MAX_LABEL_LENGTH));
}

function sanitizeWatchlist(value: unknown): Watchlist {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Watchlist = {};
  for (const [userId, items] of Object.entries(value)) {
    if (!/^\d+$/.test(userId) || !Number.isSafeInteger(Number(userId)) || !Array.isArray(items)) continue;
    const valid = items.filter(isValidWatchItem);
    const deduped = new Map<string, WatchItem>();
    for (const item of valid) deduped.set(item.address, item);
    result[userId] = [...deduped.values()].slice(-MAX_ITEMS_PER_USER);
  }
  return result;
}

export class WatchlistStore {
  private readonly file: string;
  private data: Watchlist = {};
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(file = "data/watchlists.json") { this.file = file; }

  private async load() {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.file, "utf8");
      this.data = sanitizeWatchlist(JSON.parse(raw) as unknown);
    } catch (error: unknown) {
      const e = error as NodeJS.ErrnoException;
      if (e.code !== "ENOENT") throw error;
      this.data = {};
    }
    this.loaded = true;
  }

  private async persist() {
    await mkdir(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    await rename(tmp, this.file);
  }

  private async save() {
    this.writeQueue = this.writeQueue.then(() => this.persist());
    return this.writeQueue;
  }

  async list(userId: number): Promise<WatchItem[]> {
    await this.load();
    return [...(this.data[String(userId)] ?? [])];
  }

  async userIds(): Promise<number[]> {
    await this.load();
    return Object.keys(this.data).map(Number).filter(Number.isSafeInteger);
  }

  async add(userId: number, address: string, label?: string): Promise<boolean> {
    await this.load();
    if (!Number.isSafeInteger(userId) || !ADDRESS_RE.test(address)) return false;
    const key = String(userId);
    const list = this.data[key] ?? [];
    if (list.some((x) => x.address === address)) return false;
    const cleanLabel = label?.trim().slice(0, MAX_LABEL_LENGTH) || undefined;
    list.push({ address, label: cleanLabel, addedAt: Date.now() });
    this.data[key] = list.slice(-MAX_ITEMS_PER_USER);
    await this.save();
    return true;
  }

  async remove(userId: number, address: string): Promise<boolean> {
    await this.load();
    const key = String(userId);
    const list = this.data[key] ?? [];
    const next = list.filter((x) => x.address !== address);
    if (next.length === list.length) return false;
    this.data[key] = next;
    await this.save();
    return true;
  }
}
