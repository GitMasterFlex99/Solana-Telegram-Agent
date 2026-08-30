import type { Bot } from "grammy";
import { tokenPairs } from "./market.js";
import { riskFlags, score } from "../core/scoring.js";
import { detectAlertEvents, snapshotFor } from "../core/alert-rules-v2.js";
import { AlertStateStore } from "../core/alert-state-store.js";
import { WatchlistStore } from "../core/watchlist-store.js";

export function startAlertMonitor(bot: Bot, watchlists: WatchlistStore, states: AlertStateStore, intervalMs = 5 * 60_000): NodeJS.Timeout {
  const tick = async () => {
    for (const userId of await watchlists.userIds()) {
      for (const item of await watchlists.list(userId)) {
        try {
          const pair = (await tokenPairs(item.address))[0];
          if (!pair) continue;
          const current = snapshotFor({
            opportunity: score(pair),
            momentum: Math.max(0, Math.min(100, 50 + (pair.priceChange?.h24 ?? 0) / 2)),
            priceChange24h: pair.priceChange?.h24 ?? 0,
            riskScore: Math.min(100, riskFlags(pair).length * 20),
          });
          const key = `${userId}:${item.address}`;
          const previous = await states.get(key);
          await states.set(key, current);
          const events = detectAlertEvents(previous, current);
          for (const event of events) {
            const symbol = pair.baseToken?.symbol ?? item.label ?? "token";
            await bot.api.sendMessage(userId, `🔔 ${symbol}\n${event.message}\nResearch score: ${current.opportunity}/100\nRisk flags: ${riskFlags(pair).join(", ") || "none"}`);
          }
        } catch (error) {
          console.error("Alert monitor error", { userId, address: item.address, error });
        }
      }
    }
  };
  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  void tick();
  return timer;
}
