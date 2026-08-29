import { PaperPortfolioStore } from "./paper-portfolio-store.js";
import type { PaperPosition, PaperSignal, PaperSnapshot, PaperTraderConfig } from "./paper-trader.js";

export type PaperPortfolio = { userId: number };

/** Persistent per-user paper portfolio facade. No wallet, signer, or transaction APIs are exposed. */
export class PaperPortfolioManager {
  private readonly store: PaperPortfolioStore;

  constructor(config: Partial<PaperTraderConfig> = {}, file = process.env.PAPER_PORTFOLIO_FILE ?? "data/paper-portfolios.json") {
    this.store = new PaperPortfolioStore(file, config);
  }

  open(userId: number, signal: PaperSignal, now = Date.now()): Promise<PaperPosition | null> {
    return this.store.open(userId, signal, now);
  }

  update(userId: number, positionId: string, priceUsd: number, now = Date.now()): Promise<PaperPosition | null> {
    return this.store.update(userId, positionId, priceUsd, now);
  }

  close(userId: number, positionId: string, priceUsd: number, now = Date.now()): Promise<PaperPosition | null> {
    return this.store.close(userId, positionId, priceUsd, now);
  }

  snapshot(userId: number): Promise<PaperSnapshot> {
    return this.store.snapshot(userId);
  }

  reset(userId: number): Promise<void> {
    return this.store.reset(userId);
  }
}
