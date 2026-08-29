import type { WatchItem } from "./watchlist-store.js";
import type { PipelineResult } from "./scanner-pipeline.js";
import { detectAlert, snapshotFromPair, type AlertEvent, type AlertSnapshot } from "./alert-rules.js";

export type WatchAlert = { userId: number; item: WatchItem; pair: PipelineResult; events: AlertEvent[] };

export function evaluateWatchlist(userId: number, items: WatchItem[], pairs: PipelineResult[], previous: Map<string, AlertSnapshot>): WatchAlert[] {
  const byAddress = new Map(pairs.map((pair) => [pair.baseToken?.address, pair]));
  const alerts: WatchAlert[] = [];
  for (const item of items) {
    const pair = byAddress.get(item.address);
    if (!pair) continue;
    const current = snapshotFromPair(pair);
    const old = previous.get(item.address);
    const events = detectAlert(old, current);
    previous.set(item.address, current);
    if (events.length) alerts.push({ userId, item, pair, events });
  }
  return alerts;
}
