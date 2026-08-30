export type AlertSnapshot = {
  opportunity: number;
  momentum: number;
  priceChange24h: number;
  riskScore?: number;
};

export type AlertEvent =
  | { type: "momentum"; message: string }
  | { type: "opportunity"; message: string }
  | { type: "risk"; message: string }
  | { type: "move"; message: string };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function snapshotFor(input: {
  opportunity: number;
  momentum: number;
  priceChange24h: number;
  riskScore?: number;
}): AlertSnapshot {
  return {
    opportunity: clamp(input.opportunity),
    momentum: clamp(input.momentum),
    priceChange24h: Number.isFinite(input.priceChange24h) ? input.priceChange24h : 0,
    riskScore: input.riskScore === undefined ? undefined : clamp(input.riskScore),
  };
}

export function detectAlertEvents(previous: AlertSnapshot | undefined, current: AlertSnapshot): AlertEvent[] {
  if (!previous) return [];
  const events: AlertEvent[] = [];

  if (previous.momentum < 70 && current.momentum >= 70) {
    events.push({ type: "momentum", message: "Momentum crossed 70/100." });
  }
  if (previous.opportunity < 75 && current.opportunity >= 75) {
    events.push({ type: "opportunity", message: "Research score crossed 75/100." });
  }
  if (previous.riskScore !== undefined && current.riskScore !== undefined && previous.riskScore < 60 && current.riskScore >= 60) {
    events.push({ type: "risk", message: "Risk score increased materially." });
  }
  if (previous.priceChange24h < 20 && current.priceChange24h >= 20) {
    events.push({ type: "move", message: "24h price change crossed +20%." });
  }
  if (previous.priceChange24h > -20 && current.priceChange24h <= -20) {
    events.push({ type: "move", message: "24h price change crossed -20%." });
  }

  return events;
}
