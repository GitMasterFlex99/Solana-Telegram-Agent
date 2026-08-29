export type PaperSignal = {
  address: string;
  symbol: string;
  name?: string;
  entryPriceUsd: number;
  opportunityScore: number;
  riskProfile: string;
  source: string;
  timestamp?: number;
};

export type PaperPosition = PaperSignal & {
  id: string;
  quantity: number;
  costUsd: number;
  currentPriceUsd: number;
  openedAt: number;
  closedAt?: number;
  exitPriceUsd?: number;
  realizedPnlUsd?: number;
  status: "open" | "closed";
  exitReason?: "take-profit" | "stop-loss" | "manual";
};

export type PaperTraderConfig = {
  startingBalanceUsd: number;
  positionSizeUsd: number;
  takeProfitPct: number;
  stopLossPct: number;
  maxOpenPositions: number;
};

export type PaperSnapshot = {
  balanceUsd: number;
  equityUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  positions: PaperPosition[];
};

const DEFAULTS: PaperTraderConfig = { startingBalanceUsd: 10_000, positionSizeUsd: 100, takeProfitPct: 25, stopLossPct: 15, maxOpenPositions: 10 };
const THRESHOLD_EPSILON = 1e-9;
const finitePositive = (value: number) => Number.isFinite(value) && value > 0;

export class PaperTrader {
  private readonly config: PaperTraderConfig;
  private balanceUsd: number;
  private realizedPnlUsd = 0;
  private readonly positions = new Map<string, PaperPosition>();
  private sequence = 0;

  constructor(config: Partial<PaperTraderConfig> = {}) {
    this.config = { ...DEFAULTS, ...config };
    if (!finitePositive(this.config.startingBalanceUsd) || !finitePositive(this.config.positionSizeUsd) || !Number.isInteger(this.config.maxOpenPositions) || this.config.maxOpenPositions < 1 || !finitePositive(this.config.takeProfitPct) || !finitePositive(this.config.stopLossPct)) throw new Error("Invalid paper trader configuration");
    this.balanceUsd = this.config.startingBalanceUsd;
  }

  open(signal: PaperSignal, now = Date.now()): PaperPosition | null {
    if (!finitePositive(signal.entryPriceUsd) || !Number.isFinite(signal.opportunityScore) || typeof signal.address !== "string" || signal.address.length === 0) return null;
    if ([...this.positions.values()].some(p => p.status === "open" && p.address === signal.address)) return null;
    if ([...this.positions.values()].filter(p => p.status === "open").length >= this.config.maxOpenPositions) return null;
    const costUsd = Math.min(this.config.positionSizeUsd, this.balanceUsd);
    if (!finitePositive(costUsd)) return null;
    const position: PaperPosition = { ...signal, id: `paper-${++this.sequence}`, quantity: costUsd / signal.entryPriceUsd, costUsd, currentPriceUsd: signal.entryPriceUsd, openedAt: now, status: "open" };
    this.balanceUsd -= costUsd;
    this.positions.set(position.id, position);
    return { ...position };
  }

  update(id: string, priceUsd: number, now = Date.now()): PaperPosition | null {
    const position = this.positions.get(id);
    if (!position || position.status !== "open" || !finitePositive(priceUsd)) return null;
    const changePct = ((priceUsd - position.entryPriceUsd) / position.entryPriceUsd) * 100;
    if (changePct + THRESHOLD_EPSILON >= this.config.takeProfitPct) return this.close(id, priceUsd, "take-profit", now);
    if (changePct - THRESHOLD_EPSILON <= -this.config.stopLossPct) return this.close(id, priceUsd, "stop-loss", now);
    position.currentPriceUsd = priceUsd;
    return { ...position };
  }

  close(id: string, priceUsd: number, reason: PaperPosition["exitReason"] = "manual", now = Date.now()): PaperPosition | null {
    const position = this.positions.get(id);
    if (!position || position.status !== "open" || !finitePositive(priceUsd)) return null;
    const proceedsUsd = position.quantity * priceUsd;
    const pnlUsd = proceedsUsd - position.costUsd;
    Object.assign(position, { currentPriceUsd: priceUsd, exitPriceUsd: priceUsd, realizedPnlUsd: pnlUsd, closedAt: now, exitReason: reason, status: "closed" as const });
    this.balanceUsd += proceedsUsd;
    this.realizedPnlUsd += pnlUsd;
    return { ...position };
  }

  snapshot(): PaperSnapshot {
    const positions = [...this.positions.values()].map(p => ({ ...p }));
    const open = positions.filter(p => p.status === "open");
    const openValue = open.reduce((sum, p) => sum + p.quantity * p.currentPriceUsd, 0);
    return { balanceUsd: this.balanceUsd, equityUsd: this.balanceUsd + openValue, realizedPnlUsd: this.realizedPnlUsd, unrealizedPnlUsd: open.reduce((sum, p) => sum + (p.quantity * p.currentPriceUsd - p.costUsd), 0), positions };
  }
}
