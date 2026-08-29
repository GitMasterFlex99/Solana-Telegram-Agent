import { PaperTrader, type PaperPosition, type PaperSignal, type PaperSnapshot, type PaperTraderConfig } from "./paper-trader.js";

export type PaperPortfolio = {
  userId: number;
  trader: PaperTrader;
};

export class PaperPortfolioManager {
  private readonly portfolios = new Map<number, PaperTrader>();
  private readonly config: Partial<PaperTraderConfig>;

  constructor(config: Partial<PaperTraderConfig> = {}) {
    this.config = { ...config };
  }

  private get(userId: number): PaperTrader {
    if (!Number.isSafeInteger(userId) || userId < 1) throw new Error("Invalid user id");
    let trader = this.portfolios.get(userId);
    if (!trader) {
      trader = new PaperTrader(this.config);
      this.portfolios.set(userId, trader);
    }
    return trader;
  }

  open(userId: number, signal: PaperSignal, now = Date.now()): PaperPosition | null {
    return this.get(userId).open(signal, now);
  }

  update(userId: number, positionId: string, priceUsd: number, now = Date.now()): PaperPosition | null {
    return this.get(userId).update(positionId, priceUsd, now);
  }

  close(userId: number, positionId: string, priceUsd: number, now = Date.now()): PaperPosition | null {
    return this.get(userId).close(positionId, priceUsd, "manual", now);
  }

  snapshot(userId: number): PaperSnapshot {
    return this.get(userId).snapshot();
  }

  reset(userId: number): void {
    if (!Number.isSafeInteger(userId) || userId < 1) throw new Error("Invalid user id");
    this.portfolios.delete(userId);
  }
}
