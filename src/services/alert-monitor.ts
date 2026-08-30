import type { Bot } from "grammy";
import { tokenPairs } from "./market.js";
import { researchScore, riskFlags } from "../core/scoring.js";
import { detectAlertEvents, snapshotFor } from "../core/alert-rules-v2.js";
import { AlertStateStore } from "../core/alert-state-store.js";
import { WatchlistStore } from "../core/watchlist-store.js";
import { mapWithConcurrency } from "../core/concurrency.js";

export function startAlertMonitor(bot: Bot, watchlists: WatchlistStore, states: AlertStateStore, intervalMs = 5 * 60_000): NodeJS.Timeout {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const userIds = await watchlists.userIds();
      await mapWithConcurrency(userIds, 4, async (userId) => {
        const items = await watchlists.list(userId);
        await mapWithConcurrency(items, 3, async (item) => {
          try {
            const pair = (await tokenPairs(item.address))[0];
            if (!pair) return;

            const flags = riskFlags(pair);
            const current = snapshotFor({
              opportunity: researchScore(pair),
              momentum: Math.max(0, Math.min(100, 50 + (pair.priceChange?.h24 ?? 0) / 2)),
              priceChange24h: pair.priceChange?.h24 ?? 0,
              riskScore: Math.min(100, flags.length * 20),
              liquidityUsd: pair.liquidity?.usd,
              volume24hUsd: pair.volume?.h24,
            });
            const key = `${userId}:${item.address}`;
            const previous = await states.get(key);
            await states.set(key, current);
            const events = detectAlertEvents(previous, current);
            if (!events.length) return;

            const symbol = pair.baseToken?.symbol ?? item.label ?? "token";
            const eventText = events.map(event => `• ${event.message}`).join("\n");
            await bot.api.sendMessage(
              userId,
              `🔔 ${symbol}\n${eventText}\n\nResearch score: ${current.opportunity}/100\nRisk flags: ${flags.join(", ") || "none"}`
            );
          } catch (error) {
            console.error("Alert monitor error", { userId, address: item.address, error });
          }
        });
      });
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  void tick();
  return timer;
}
