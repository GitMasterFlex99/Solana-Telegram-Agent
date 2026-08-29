import { InlineKeyboard } from "grammy";
import { PaperPortfolioManager } from "./paper-portfolio.js";
import type { PipelineResult } from "./scanner-pipeline.js";

export const PAPER_MODE_LABEL = "🟡 PAPER MODE — NO REAL TRADES";

export function createPaperPortfolioUi(paper: PaperPortfolioManager, pairForAddress: (address: string) => PipelineResult | undefined) {
  const money = (n: number) => `$${n.toFixed(2)}`;
  const text = (userId: number) => {
    const s = paper.snapshot(userId);
    const open = s.positions.filter(p => p.status === "open");
    const lines = [PAPER_MODE_LABEL, "", `Balance: ${money(s.balanceUsd)}`, `Equity: ${money(s.equityUsd)}`, `Realized P&L: ${s.realizedPnlUsd >= 0 ? "+" : ""}${money(s.realizedPnlUsd)}`, `Unrealized P&L: ${s.unrealizedPnlUsd >= 0 ? "+" : ""}${money(s.unrealizedPnlUsd)}`, `Open positions: ${open.length}`];
    if (open.length) {
      lines.push("", "Open positions:");
      for (const p of open) lines.push(`• ${p.symbol} · ${money(p.currentPriceUsd)} · ${p.id}`);
    }
    return lines.join("\n");
  };
  const keyboard = (userId: number) => {
    const s = paper.snapshot(userId);
    const kb = new InlineKeyboard();
    for (const p of s.positions.filter(x => x.status === "open")) kb.text(`Close ${p.symbol}`, `paper-close:${p.id}`).row();
    kb.text("↻ Refresh", "portfolio").text("↺ Reset", "paper-reset");
    return kb;
  };
  return { text, keyboard, pairForAddress };
}

export function paperSignalFromPair(pair: PipelineResult, riskProfile: string) {
  const price = pair.priceUsd;
  if (!pair.baseToken?.address || !pair.baseToken.symbol || !Number.isFinite(price) || price <= 0) return null;
  return { address: pair.baseToken.address, symbol: pair.baseToken.symbol, name: pair.baseToken.name, entryPriceUsd: price, opportunityScore: pair.opportunityScore, riskProfile, source: pair.source };
}
