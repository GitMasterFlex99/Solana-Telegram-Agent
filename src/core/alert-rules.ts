import type { ScannerResult } from "./scanner.js";

export type AlertSnapshot = { opportunity: number; momentum: number; priceChange24h: number; riskScore?: number };
export type AlertEvent = "momentum_jump" | "opportunity_jump" | "price_move" | "risk_deteriorated";

export function detectAlert(previous: AlertSnapshot | undefined, current: AlertSnapshot): AlertEvent[] {
  if (!previous) return [];
  const events: AlertEvent[] = [];
  if (current.momentum - previous.momentum >= 15) events.push("momentum_jump");
  if (current.opportunity - previous.opportunity >= 15) events.push("opportunity_jump");
  if (Math.abs(current.priceChange24h - previous.priceChange24h) >= 20) events.push("price_move");
  if (previous.riskScore !== undefined && current.riskScore !== undefined && current.riskScore <= previous.riskScore - 15) events.push("risk_deteriorated");
  return events;
}

export function snapshotFromPair(pair: ScannerResult, riskScore?: number): AlertSnapshot {
  return { opportunity: pair.opportunityScore, momentum: pair.momentum.score, priceChange24h: pair.priceChange?.h24 ?? 0, riskScore };
}
