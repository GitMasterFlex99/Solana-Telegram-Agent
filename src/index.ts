import { Bot, InlineKeyboard } from "grammy";
import { discoverCandidates, fetchSolanaPairs, type DiscoveredPair } from "./core/market-discovery.js";
import { researchScore, riskFlags, score } from "./core/scoring.js";
import { analyzeWithOpenAI, buildTokenPrompt } from "./core/ai.js";
import { createEncryptedAIStore } from "./core/encrypted-ai-store.js";
import { WatchlistStore } from "./core/watchlist-store.js";
import { AlertStateStore } from "./core/alert-state-store.js";
import { tokenPairs } from "./services/market.js";
import { fetchXSignal } from "./services/x-signals.js";
import { startAlertMonitor } from "./services/alert-monitor.js";
import { validateProductionConfig } from "./core/production-guards.js";

type Pair = DiscoveredPair & { priceChange?: { h1?: number; h24?: number } };
type RankedCandidate = { pair: Pair; social: Awaited<ReturnType<typeof fetchXSignal>>; researchScore: number };

const configErrors = validateProductionConfig({
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  aiEncryptionKey: process.env.AI_KEY_ENCRYPTION_KEY,
});
if (configErrors.length) throw new Error(`Invalid production configuration: ${configErrors.join("; ")}`);

const token = process.env.TELEGRAM_BOT_TOKEN!;
const allowedChatId = process.env.TELEGRAM_CHAT_ID;
const bot = new Bot(token);
const aiStore = process.env.AI_KEY_ENCRYPTION_KEY ? createEncryptedAIStore() : null;
const watchlists = new WatchlistStore();
const alertStates = new AlertStateStore();
const pendingAI = new Map<number, number>();
const AI_SETUP_TTL_MS = 5 * 60_000;

const money = (n?: number) => !Number.isFinite(n) ? "—" : n! >= 1e6 ? `$${(n! / 1e6).toFixed(1)}M` : n! >= 1e3 ? `$${(n! / 1e3).toFixed(1)}K` : `$${n!.toFixed(0)}`;
const age = (ts?: number) => {
  if (!ts) return "unknown";
  const h = Math.max(0, (Date.now() - ts) / 3_600_000);
  return h < 24 ? `${h.toFixed(0)}h` : `${(h / 24).toFixed(1)}d`;
};
const guard = (ctx: { chat?: { id: number } }) => !allowedChatId || String(ctx.chat?.id) === allowedChatId;
const menu = () => new InlineKeyboard().text("🔎 Scan", "scan").row().text("⭐ Watchlist", "watchlist").text("⚙️ Settings", "settings").row().text("ℹ️ Help", "help");
const settingsMenu = () => new InlineKeyboard().text("🤖 AI settings", "ai_settings").row().text("𝕏 X signals", "x_settings").row().text("⬅️ Back", "back");

const settingsText = (userId?: number) => {
  const ai = aiStore && userId ? aiStore.has(String(userId)) : false;
  const x = Boolean(process.env.X_BEARER_TOKEN);
  return `⚙️ Settings\n\nAI: ${ai ? "connected" : "not connected"}\nX signals: ${x ? "enabled" : "unavailable"}\n\nAI is optional. The bot remains fully usable without it.`;
};

async function rankCandidates(pairs: Pair[], socialLimit = 20): Promise<RankedCandidate[]> {
  const pool = pairs.slice(0, socialLimit);
  const ranked: RankedCandidate[] = await Promise.all(pool.map(async pair => {
    const social = await fetchXSignal(pair.baseToken?.symbol ?? "", pair.baseToken?.address ?? "");
    return { pair, social, researchScore: researchScore(pair, social.available ? social.score : 0) };
  }));
  return ranked.sort((a, b) => b.researchScore - a.researchScore);
}

async function sendScan(ctx: any) {
  await ctx.reply("🔎 Scanning Solana markets...");
  try {
    const pairs = discoverCandidates(await fetchSolanaPairs());
    if (!pairs.length) { await ctx.reply("No candidates passed the basic filters.", { reply_markup: menu() }); return; }
    const ranked = await rankCandidates(pairs, 20);
    for (const [i, item] of ranked.slice(0, 5).entries()) {
      const p = item.pair;
      const buys = p.txns?.h24?.buys ?? 0;
      const sells = p.txns?.h24?.sells ?? 0;
      const flags = riskFlags(p);
      const text = [
        `${i + 1}. ${p.baseToken?.symbol ?? "Unknown"} — ${item.researchScore}/100`,
        `Liquidity: ${money(p.liquidity?.usd)}   Volume: ${money(p.volume?.h24)}`,
        `24h: ${p.priceChange?.h24?.toFixed(1) ?? "—"}%   Buys/Sells: ${buys}/${sells}`,
        `Age: ${age(p.pairCreatedAt)}   FDV: ${money(p.fdv)}`,
        flags.length ? `⚠️ ${flags.join(", ")}` : "Risk flags: none from basic checks",
        `𝕏 Social: ${item.social.available ? `${item.social.score}/100 — ${item.social.summary}` : "unavailable"}`,
        "Research score weighs market structure most heavily; social is supporting evidence only."
      ].join("\n");
      await ctx.reply(text, { reply_markup: new InlineKeyboard().text("Analyze", `analyze:${p.baseToken?.address ?? ""}`).text("⭐ Watch", `watch:${p.baseToken?.address ?? ""}`) });
    }
  } catch (e) {
    console.error(e);
    await ctx.reply("Couldn't fetch market data right now. Try again later.", { reply_markup: menu() });
  }
}

bot.command("start", async ctx => { if (!guard(ctx)) return; await ctx.reply("Solana Meme Agent\n\nSimple by design. Scan markets, inspect risk, optionally add your own AI key, and watch a few tokens.\n\nTrading is disabled.", { reply_markup: menu() }); });
bot.command("scan", async ctx => { if (guard(ctx)) await sendScan(ctx); });
bot.command("portfolio", async ctx => { if (guard(ctx)) await ctx.reply("💼 No wallet is connected. Trading is disabled.", { reply_markup: menu() }); });
bot.command("watch", async ctx => {
  if (!guard(ctx) || !ctx.message || !ctx.from) return;
  const userId = ctx.from.id;
  const address = ctx.message.text.split(/\s+/)[1] ?? "";
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) { await ctx.reply("Usage: /watch <Solana token address>"); return; }
  await watchlists.add(userId, address);
  await ctx.reply("⭐ Token added to your watchlist. Alerts run automatically.", { reply_markup: menu() });
});
bot.command("unwatch", async ctx => {
  if (!guard(ctx) || !ctx.message || !ctx.from) return;
  const userId = ctx.from.id;
  const address = ctx.message.text.split(/\s+/)[1] ?? "";
  if (!address) { await ctx.reply("Usage: /unwatch <Solana token address>"); return; }
  const removed = await watchlists.remove(userId, address);
  await ctx.reply(removed ? "Removed from your watchlist." : "That token was not on your watchlist.");
});
bot.command("settings", async ctx => { if (guard(ctx)) await ctx.reply(settingsText(ctx.from?.id), { reply_markup: settingsMenu() }); });
bot.command("help", async ctx => { if (guard(ctx)) await ctx.reply("/scan — find candidates\n/watch <address> — enable alerts\n/unwatch <address> — remove alerts\n/settings — optional AI and X signals\n\nNever send a seed phrase or private key. Trading is disabled.", { reply_markup: menu() }); });

bot.callbackQuery("scan", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await sendScan(ctx); });
bot.callbackQuery("watchlist", async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx)) return; const userId = ctx.from?.id; if (userId === undefined) return; const items = await watchlists.list(userId); await ctx.reply(items.length ? `⭐ Watchlist\n\n${items.map((x, i) => `${i + 1}. ${x.label ?? x.address}`).join("\n")}` : "⭐ Your watchlist is empty.\n\nUse /watch <token address> from a token screen.", { reply_markup: menu() }); });
bot.callbackQuery("settings", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply(settingsText(ctx.from?.id), { reply_markup: settingsMenu() }); });
bot.callbackQuery("ai_settings", async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx)) return; const userId = ctx.from?.id; if (userId === undefined) return; const connected = Boolean(aiStore?.has(String(userId))); const kb = new InlineKeyboard(); if (connected) kb.text("Remove AI key", "ai_remove"); else kb.text("Connect OpenAI", "ai_add"); kb.row().text("⬅️ Settings", "settings"); await ctx.reply(`🤖 AI Analysis\n\n${connected ? "Connected — token screens can use your key." : "Optional — the bot works normally without AI."}\n\nFor safety, key setup only works in a private chat. Your key message is deleted after processing. Setup expires after 5 minutes.`, { reply_markup: kb }); });
bot.callbackQuery("ai_add", async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx) || !aiStore) return; if (ctx.chat?.type !== "private") { await ctx.reply("Connect an AI key only from a private chat."); return; } pendingAI.set(ctx.from.id, Date.now() + AI_SETUP_TTL_MS); await ctx.reply("Send your OpenAI API key as your next message. The message will be deleted after processing. Setup expires in 5 minutes."); });
bot.callbackQuery("ai_remove", async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx) || !aiStore) return; aiStore.remove(String(ctx.from.id)); pendingAI.delete(ctx.from.id); await ctx.reply("OpenAI key removed.", { reply_markup: settingsMenu() }); });
bot.callbackQuery("x_settings", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply(process.env.X_BEARER_TOKEN ? "𝕏 X signals are enabled. Recent public posts are used as supporting evidence; market structure remains the dominant part of the research score." : "𝕏 X signals are currently unavailable. Set X_BEARER_TOKEN on the bot server to enable them. The rest of the bot does not depend on X.", { reply_markup: settingsMenu() }); });
bot.callbackQuery("back", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply("Main menu", { reply_markup: menu() }); });
bot.callbackQuery(/^watch:(.+)$/, async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx)) return; await watchlists.add(ctx.from.id, ctx.match[1]); await ctx.reply("⭐ Added to watchlist. You will get alerts when monitored thresholds change.", { reply_markup: menu() }); });

bot.on("message:text", async ctx => {
  if (!guard(ctx) || !ctx.message || !ctx.from || !ctx.chat) return;
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const expiresAt = pendingAI.get(userId);
  if (expiresAt === undefined) return;
  if (Date.now() > expiresAt) {
    pendingAI.delete(userId);
    await ctx.deleteMessage().catch(() => undefined);
    await ctx.reply("AI key setup expired. The message was deleted. Open Settings → AI and start again.", { reply_markup: settingsMenu() });
    return;
  }
  if (text.startsWith("/")) return;
  pendingAI.delete(userId);
  try {
    if (ctx.chat.type !== "private") throw new Error("AI key setup requires a private chat");
    aiStore?.set(String(userId), text);
    await ctx.deleteMessage().catch(() => undefined);
    await ctx.reply("OpenAI key saved securely. The key message was deleted.", { reply_markup: settingsMenu() });
  } catch {
    await ctx.deleteMessage().catch(() => undefined);
    await ctx.reply("Couldn't save that key. Check the key format and server encryption configuration.");
  }
});

bot.callbackQuery(/^analyze:(.+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  if (!guard(ctx)) return;
  try {
    const pairs = await tokenPairs(ctx.match[1]);
    if (!pairs.length) { await ctx.reply("I couldn't find a Solana market for that token.", { reply_markup: menu() }); return; }
    const p = pairs.reduce((best, candidate) => {
      const bestLiquidity = best.liquidity?.usd ?? 0;
      const candidateLiquidity = candidate.liquidity?.usd ?? 0;
      if (candidateLiquidity !== bestLiquidity) return candidateLiquidity > bestLiquidity ? candidate : best;
      return (candidate.volume?.h24 ?? 0) > (best.volume?.h24 ?? 0) ? candidate : best;
    });
    const flags = riskFlags(p);
    const social = await fetchXSignal(p.baseToken?.symbol ?? "", p.baseToken?.address ?? "");
    const finalScore = researchScore(p, social.available ? social.score : 0);
    const text = [
      `🔍 ${p.baseToken?.symbol ?? "Unknown"}`,
      p.baseToken?.name ?? "",
      `Research score: ${finalScore}/100`,
      `Market score: ${score(p)}/100`,
      `Price: $${p.priceUsd ?? "—"}`,
      `Liquidity: ${money(p.liquidity?.usd)}`,
      `24h volume: ${money(p.volume?.h24)}`,
      `24h change: ${p.priceChange?.h24?.toFixed(1) ?? "—"}%`,
      `Age: ${age(p.pairCreatedAt)}`,
      flags.length ? `⚠️ Risk flags: ${flags.join(", ")}` : "✅ No basic risk flags detected",
      `𝕏 Social: ${social.available ? `${social.score}/100 — ${social.summary}` : "unavailable"}`,
      "",
      "Market-data research only — not a guarantee that the token is safe or profitable."
    ].filter(Boolean).join("\n");
    const keyboard = new InlineKeyboard().text("⭐ Watch", `watch:${p.baseToken?.address ?? ""}`);
    if (aiStore?.has(String(ctx.from.id))) keyboard.text("🤖 AI Analysis", `ai:${p.baseToken?.address ?? ""}`);
    keyboard.row();
    if (p.url) keyboard.url("Open market", p.url).row();
    keyboard.text("🔎 Scan again", "scan");
    await ctx.reply(text, { reply_markup: keyboard });
  } catch (e) { console.error(e); await ctx.reply("Couldn't analyze that token right now.", { reply_markup: menu() }); }
});

bot.callbackQuery(/^ai:(.+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  if (!guard(ctx) || !aiStore) return;
  try {
    const pairs = await tokenPairs(ctx.match[1]);
    if (!pairs.length) { await ctx.reply("Token data is no longer available."); return; }
    const p = pairs.reduce((best, candidate) => {
      const bestLiquidity = best.liquidity?.usd ?? 0;
      const candidateLiquidity = candidate.liquidity?.usd ?? 0;
      if (candidateLiquidity !== bestLiquidity) return candidateLiquidity > bestLiquidity ? candidate : best;
      return (candidate.volume?.h24 ?? 0) > (best.volume?.h24 ?? 0) ? candidate : best;
    });
    const social = await fetchXSignal(p.baseToken?.symbol ?? "", p.baseToken?.address ?? "");
    const finalScore = researchScore(p, social.available ? social.score : 0);
    const prompt = buildTokenPrompt({ symbol: p.baseToken?.symbol ?? "Unknown", score: finalScore, riskFlags: riskFlags(p), social: social.available ? `${social.score}/100 — ${social.summary}` : "unavailable", marketContext: `liquidity=${money(p.liquidity?.usd)}, 24h volume=${money(p.volume?.h24)}, 24h change=${p.priceChange?.h24 ?? "unknown"}%` });
    const result = await analyzeWithOpenAI(prompt, { apiKey: aiStore.get(String(ctx.from.id))! });
    await ctx.reply(result, { reply_markup: menu() });
  } catch (e) { console.error(e); await ctx.reply("AI analysis failed. Check your key and try again.", { reply_markup: menu() }); }
});

const alertTimer = startAlertMonitor(bot, watchlists, alertStates);
bot.catch((err) => console.error("Telegram bot error", err));

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);
  clearInterval(alertTimer);
  bot.stop();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

await bot.start();
