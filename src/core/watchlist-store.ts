import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type WatchItem = { address: string; label?: string; addedAt: number };
export type Watchlist = Record<string, WatchItem[]>;

export class WatchlistStore {
  private readonly file: string;
  private data: Watchlist = {};
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();
  constructor(file = "data/watchlists.json") { this.file = file; }
  private async load() {
    if (this.loaded) return;
    this.loaded = true;
    try { const raw = await readFile(this.file, "utf8"); const parsed = JSON.parse(raw) as unknown; if (parsed && typeof parsed === "object") this.data = parsed as Watchlist; }
    catch (error: unknown) { const e = error as NodeJS.ErrnoException; if (e.code !== "ENOENT") throw error; }
  }
  private async persist() {
    await mkdir(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    await rename(tmp, this.file);
  }
  private async save() { this.writeQueue = this.writeQueue.then(() => this.persist()); return this.writeQueue; }
  async list(userId: number): Promise<WatchItem[]> { await this.load(); return [...(this.data[String(userId)] ?? [])]; }
  async userIds(): Promise<number[]> { await this.load(); return Object.keys(this.data).map(Number).filter(Number.isSafeInteger); }
  async add(userId: number, address: string, label?: string): Promise<boolean> { await this.load(); const key=String(userId); const list=this.data[key] ?? []; if (list.some(x=>x.address===address)) return false; list.push({ address, label, addedAt: Date.now() }); this.data[key]=list.slice(-50); await this.save(); return true; }
  async remove(userId: number, address: string): Promise<boolean> { await this.load(); const key=String(userId); const list=this.data[key] ?? []; const next=list.filter(x=>x.address!==address); if(next.length===list.length)return false; this.data[key]=next; await this.save(); return true; }
}
