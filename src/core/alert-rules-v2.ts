export type AlertSnapshot = {
  opportunity: number;
  momentum: number;
  priceChange24h: number;
  riskScore?: number;
  liquidityUsd?: number;
  volume24hUsd?: number;
};

export type AlertEvent =
  | { type: "momentum"; message: string }
  | { type: "opportunity"; message: string }
  | { type: "risk"; message: string }
  | { type: "move"; message: string }
  | { type: "volume"; message: string }
  | { type: "liquidity"; message: string };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function snapshotFor(input: {
  opportunity: number;
  momentum: number;
  priceChange24h: number;
  riskScore?: number;
  liquidityUsd?: number;
  volume24hUsd?: number;
}): AlertSnapshot {
  return {
    opportunity: clamp(input.opportunity),
    momentum: clamp(input.momentum),
    priceChange24h: Number.isFinite(input.priceChange24h) ? input.priceChange24h : 0,
    riskScore: input.riskScore === undefined ? undefined : clamp(input.riskScore),
    liquidityUsd: Number.isFinite(input.liquidityUsd) ? Math.max(0, input.liquidityUsd!) : undefined,
    volume24hUsd: Number.isFinite(input.volume24hUsd) ? Math.max(0, input.volume24hUsd!) : undefined,
  };
}

export function detectAlertEvents(previous: AlertSnapshot | undefined, current: AlertSnapshot): AlertEvent[] {
  if (!previous) return [];
  const events: AlertEvent[] = [];

  // Threshold gaps prevent repeated notifications while values hover near a boundary.
  if (previous.momentum < 65 && current.momentum >= 70) events.push({ type: "momentum", message: "Momentum crossed 70/100." });
  if (previous.opportunity < 70 && current.opportunity >= 75) events.push({ type: "opportunity", message: "Research score crossed 75/100." });
  if (previous.riskScore !== undefined && current.riskScore !== undefined && previous.riskScore < 50 && current.riskScore >= 60) events.push({ type: "risk", message: "Risk increased materially." });
  if (previous.priceChange24h < 15 && current.priceChange24h >= 20) events.push({ type: "move", message: "24h price change crossed +20%." });
  if (previous.priceChange24h > -15 && current.priceChange24h <= -20) events.push({ type: "move", message: "24h price change crossed -20%." });

  if (previous.volume24hUsd !== undefined && current.volume24hUsd !== undefined && previous.volume24hUsd > 0 && current.volume24hUsd >= previous.volume24hUsd * 2) {
    events.push({ type: "volume", message: "24h volume roughly doubled since the last check." });
  }
  if (previous.liquidityUsd !== undefined && current.liquidityUsd !== undefined && previous.liquidityUsd > 0 && current.liquidityUsd <= previous.liquidityUsd * 0.7) {
    events.push({ type: "liquidity", message: "Liquidity fell by 30% or more." });
  }

  return events;
}
