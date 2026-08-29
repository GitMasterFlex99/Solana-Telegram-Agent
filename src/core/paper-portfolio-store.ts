import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { PaperTrader, type PaperPosition, type PaperSignal, type PaperSnapshot, type PaperTraderConfig } from "./paper-trader.js";

type PersistedPortfolio = { balanceUsd: number; realizedPnlUsd: number; sequence: number; positions: PaperPosition[] };
const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const DEFAULT_BALANCE = 10_000;

function finitePositive(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value > 0; }
function finiteNonNegative(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0; }

function validPosition(value: unknown): value is PaperPosition {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.id === "string" && /^paper-\d+$/.test(p.id)
    && typeof p.address === "string" && ADDRESS_RE.test(p.address)
    && typeof p.symbol === "string" && finitePositive(p.entryPriceUsd)
    && finitePositive(p.quantity) && finitePositive(p.costUsd) && finitePositive(p.currentPriceUsd)
    && typeof p.openedAt === "number" && Number.isFinite(p.openedAt)
    && (p.status === "open" || p.status === "closed")
    && (p.exitReason === undefined || p.exitReason === "take-profit" || p.exitReason === "stop-loss" || p.exitReason === "manual")
    && (p.exitPriceUsd === undefined || finitePositive(p.exitPriceUsd))
    && (p.realizedPnlUsd === undefined || typeof p.realizedPnlUsd === "number" && Number.isFinite(p.realizedPnlUsd));
}

function clean(value: unknown): PersistedPortfolio {
  if (!value || typeof value !== "object") return { balanceUsd: DEFAULT_BALANCE, realizedPnlUsd: 0, sequence: 0, positions: [] };
  const p = value as Record<string, unknown>;
  const positions = Array.isArray(p.positions) ? p.positions.filter(validPosition).slice(-100) : [];
  const sequence = typeof p.sequence === "number" && Number.isSafeInteger(p.sequence) && p.sequence >= 0
    ? p.sequence : positions.reduce((m, x) => Math.max(m, Number(x.id.slice(6))), 0);
  return {
    balanceUsd: finiteNonNegative(p.balanceUsd) ? p.balanceUsd : DEFAULT_BALANCE,
    realizedPnlUsd: typeof p.realizedPnlUsd === "number" && Number.isFinite(p.realizedPnlUsd) ? p.realizedPnlUsd : 0,
    sequence, positions,
  };
}

export class PaperPortfolioStore {
  private readonly file: string;
  private readonly config: Partial<PaperTraderConfig>;
  private data: Record<string, PersistedPortfolio> = {};
  private loaded = false;
  private queue: Promise<void> = Promise.resolve();

  constructor(file = "data/paper-portfolios.json", config: Partial<PaperTraderConfig> = {}) { this.file = file; this.config = config; }

  private async load() {
    if (this.loaded) return;
    try { this.data = JSON.parse(await readFile(this.file, "utf8")) as Record<string, PersistedPortfolio>; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; this.data = {}; }
    this.data = Object.fromEntries(Object.entries(this.data).filter(([id]) => /^\d+$/.test(id) && Number.isSafeInteger(Number(id))).map(([id, value]) => [id, clean(value)]));
    this.loaded = true;
  }

  private async save() {
    this.queue = this.queue.then(async () => {
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
      await rename(tmp, this.file);
    });
    return this.queue;
  }

  async snapshot(userId: number): Promise<PaperSnapshot> {
    await this.load(); const p = this.data[String(userId)];
    return p ? this.rebuild(p).snapshot() : new PaperTrader(this.config).snapshot();
  }

  async open(userId: number, signal: PaperSignal, now = Date.now()): Promise<PaperPosition | null> {
    await this.load(); const p = this.data[String(userId)] ?? { balanceUsd: DEFAULT_BALANCE, realizedPnlUsd: 0, sequence: 0, positions: [] };
    const trader = this.rebuild(p); const result = trader.open(signal, now);
    if (result) { this.data[String(userId)] = this.export(trader); await this.save(); }
    return result;
  }

  async update(userId: number, id: string, priceUsd: number, now = Date.now()): Promise<PaperPosition | null> {
    await this.load(); const p = this.data[String(userId)]; if (!p) return null;
    const trader = this.rebuild(p); const result = trader.update(id, priceUsd, now);
    if (result) { this.data[String(userId)] = this.export(trader); await this.save(); }
    return result;
  }

  async close(userId: number, id: string, priceUsd: number, now = Date.now()): Promise<PaperPosition | null> {
    await this.load(); const p = this.data[String(userId)]; if (!p) return null;
    const trader = this.rebuild(p); const result = trader.close(id, priceUsd, "manual", now);
    if (result) { this.data[String(userId)] = this.export(trader); await this.save(); }
    return result;
  }

  async reset(userId: number): Promise<void> { await this.load(); delete this.data[String(userId)]; await this.save(); }

  private rebuild(p: PersistedPortfolio): PaperTrader {
    const trader = new PaperTrader(this.config);
    for (const pos of p.positions) {
      const signal: PaperSignal = { address: pos.address, symbol: pos.symbol, name: pos.name, entryPriceUsd: pos.entryPriceUsd, opportunityScore: pos.opportunityScore, riskProfile: pos.riskProfile, source: pos.source, timestamp: pos.timestamp };
      const opened = trader.open(signal, pos.openedAt); if (!opened) continue;
      if (pos.status === "closed" && pos.exitPriceUsd !== undefined) trader.close(opened.id, pos.exitPriceUsd, pos.exitReason ?? "manual", pos.closedAt ?? pos.openedAt);
      else if (pos.currentPriceUsd !== pos.entryPriceUsd) trader.update(opened.id, pos.currentPriceUsd, pos.openedAt);
    }
    return trader;
  }

  private export(trader: PaperTrader): PersistedPortfolio {
    const s = trader.snapshot(); const maxId = s.positions.reduce((m, p) => Math.max(m, Number(p.id.slice(6))), 0);
    return { balanceUsd: s.balanceUsd, realizedPnlUsd: s.realizedPnlUsd, sequence: maxId, positions: s.positions };
  }
}
