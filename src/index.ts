import { Bot, InlineKeyboard } from "grammy";
import { discoverCandidates, fetchSolanaPairs, type DiscoveredPair } from "./core/market-discovery.js";
import { riskFlags, score } from "./core/scoring.js";

type Pair = DiscoveredPair & { priceChange?: { h1?: number; h24?: number } };

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatId = process.env.TELEGRAM_CHAT_ID;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
const bot = new Bot(token);

const money = (n?: number) => !Number.isFinite(n) ? "—" : n! >= 1e6 ? `$${(n! / 1e6).toFixed(1)}M` : n! >= 1e3 ? `$${(n! / 1e3).toFixed(1)}K` : `$${n!.toFixed(0)}`;
const age = (ts?: number) => {
  if (!ts) return "unknown";
  const h = Math.max(0, (Date.now() - ts) / 3_600_000);
  return h < 24 ? `${h.toFixed(0)}h` : `${(h / 24).toFixed(1)}d`;
};
const guard = (ctx: { chat?: { id: number } }) => !allowedChatId || String(ctx.chat?.id) === allowedChatId;
const menu = () => new InlineKeyboard().text("🔎 Scan", "scan").row().text("💼 Portfolio", "portfolio").text("ℹ️ Help", "help");

async function tokenPairs(address: string): Promise<Pair[]> {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return [];
  const r = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${encodeURIComponent(address)}`);
  if (!r.ok) throw new Error(`DexScreener HTTP ${r.status}`);
  const d = await r.json() as Pair[];
  return d.filter(p => p.chainId === "solana").sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)).slice(0, 3);
}

async function sendScan(ctx: any) {
  await ctx.reply("🔎 Scanning Solana markets...");
  try {
    const pairs = discoverCandidates(await fetchSolanaPairs());
    const candidates = pairs.sort((a, b) => score(b) - score(a)).slice(0, 5);
    if (!candidates.length) { await ctx.reply("No candidates passed the basic filters.", { reply_markup: menu() }); return; }
    for (const [i, p] of candidates.entries()) {
      const buys = p.txns?.h24?.buys ?? 0;
      const sells = p.txns?.h24?.sells ?? 0;
      const flags = riskFlags(p);
      const text = [
        `${i + 1}. ${p.baseToken?.symbol ?? "Unknown"} — ${score(p)}/100`,
        `Liquidity: ${money(p.liquidity?.usd)}   Volume: ${money(p.volume?.h24)}`,
        `24h: ${p.priceChange?.h24?.toFixed(1) ?? "—"}%   Buys/Sells: ${buys}/${sells}`,
        `Age: ${age(p.pairCreatedAt)}   FDV: ${money(p.fdv)}`,
        flags.length ? `⚠️ ${flags.join(", ")}` : "Risk flags: none from basic checks",
        "Research score only — not a buy signal."
      ].join("\n");
      await ctx.reply(text, { reply_markup: new InlineKeyboard().text("Analyze", `analyze:${p.baseToken?.address ?? ""}`) });
    }
  } catch (e) {
    console.error(e);
    await ctx.reply("Couldn't fetch market data right now. Try again later.", { reply_markup: menu() });
  }
}

bot.command("start", async ctx => { if (!guard(ctx)) return; await ctx.reply("Solana Meme Agent\n\nSimple by design. I scan first; you stay in control.\n\nTrading is disabled for now.", { reply_markup: menu() }); });
bot.command("scan", async ctx => { if (guard(ctx)) await sendScan(ctx); });
bot.command("portfolio", async ctx => { if (guard(ctx)) await ctx.reply("💼 No wallet is connected yet. Trading is disabled.", { reply_markup: menu() }); });
bot.command("help", async ctx => { if (guard(ctx)) await ctx.reply("Use the buttons or /scan.\n\nThe bot never asks for a seed phrase or private key. Real trades will require explicit wallet approval.", { reply_markup: menu() }); });
bot.callbackQuery("scan", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await sendScan(ctx); });
bot.callbackQuery("portfolio", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply("💼 No wallet is connected yet. Trading is disabled.", { reply_markup: menu() }); });
bot.callbackQuery("help", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply("I scan public Solana market data and rank candidates using liquidity, volume, activity, age and valuation checks.\n\nNothing is bought automatically.", { reply_markup: menu() }); });
bot.callbackQuery(/^analyze:(.+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  if (!guard(ctx)) return;
  try {
    const pairs = await tokenPairs(ctx.match[1]);
    if (!pairs.length) { await ctx.reply("I couldn't find a Solana market for that token.", { reply_markup: menu() }); return; }
    const p = pairs[0];
    const flags = riskFlags(p);
    const text = [
      `🔍 ${p.baseToken?.symbol ?? "Unknown"}`,
      p.baseToken?.name ?? "",
      `Score: ${score(p)}/100`,
      `Price: $${p.priceUsd ?? "—"}`,
      `Liquidity: ${money(p.liquidity?.usd)}`,
      `24h volume: ${money(p.volume?.h24)}`,
      `24h change: ${p.priceChange?.h24?.toFixed(1) ?? "—"}%`,
      `Age: ${age(p.pairCreatedAt)}`,
      flags.length ? `⚠️ Risk flags: ${flags.join(", ")}` : "✅ No basic risk flags detected",
      "",
      "Market-data analysis only — not a guarantee that the token is safe or profitable."
    ].filter(Boolean).join("\n");
    const keyboard = new InlineKeyboard();
    if (p.url) keyboard.url("Open market", p.url).row();
    keyboard.text("🔎 Scan again", "scan");
    await ctx.reply(text, { reply_markup: keyboard });
  } catch (e) {
    console.error(e);
    await ctx.reply("Couldn't analyze that token right now.", { reply_markup: menu() });
  }
});

bot.catch(e => console.error("Telegram bot error", e));
await bot.api.setMyCommands([
  { command: "start", description: "Open the main menu" },
  { command: "scan", description: "Find Solana candidates" },
  { command: "portfolio", description: "View portfolio" },
  { command: "help", description: "Show help" }
]);
console.log("Solana Telegram Agent running");
await bot.start();
