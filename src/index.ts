import { Bot, InlineKeyboard } from "grammy";
import { discoverCandidates, fetchSolanaPairs, type DiscoveredPair } from "./core/market-discovery.js";
import { riskFlags, score } from "./core/scoring.js";
import { analyzeWithOpenAI, buildTokenPrompt } from "./core/ai.js";
import { createEncryptedAIStore } from "./core/encrypted-ai-store.js";
import { parseTwitterAccount } from "./core/twitter-link.js";

type Pair = DiscoveredPair & { priceChange?: { h1?: number; h24?: number } };

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatId = process.env.TELEGRAM_CHAT_ID;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
const bot = new Bot(token);
const aiStore = process.env.AI_KEY_ENCRYPTION_KEY ? createEncryptedAIStore() : null;

const money = (n?: number) => !Number.isFinite(n) ? "—" : n! >= 1e6 ? `$${(n! / 1e6).toFixed(1)}M` : n! >= 1e3 ? `$${(n! / 1e3).toFixed(1)}K` : `$${n!.toFixed(0)}`;
const age = (ts?: number) => {
  if (!ts) return "unknown";
  const h = Math.max(0, (Date.now() - ts) / 3_600_000);
  return h < 24 ? `${h.toFixed(0)}h` : `${(h / 24).toFixed(1)}d`;
};
const guard = (ctx: { chat?: { id: number } }) => !allowedChatId || String(ctx.chat?.id) === allowedChatId;
const menu = () => new InlineKeyboard().text("🔎 Scan", "scan").row().text("💼 Portfolio", "portfolio").text("⚙️ Settings", "settings").row().text("ℹ️ Help", "help");

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
bot.command("settings", async ctx => { if (guard(ctx)) await ctx.reply(settingsText(ctx.from?.id), { reply_markup: settingsMenu() }); });
bot.command("help", async ctx => { if (guard(ctx)) await ctx.reply("Use the buttons or /scan.\n\nThe bot never asks for a seed phrase or private key. Real trades will require explicit wallet approval.", { reply_markup: menu() }); });

const settingsMenu = () => new InlineKeyboard().text("🤖 AI settings", "ai_settings").row().text("𝕏 Link X account", "x_link").row().text("⬅️ Back", "back");
const settingsText = (userId?: number) => {
  const ai = aiStore && userId ? aiStore.has(String(userId)) : false;
  return `⚙️ Settings\n\nAI: ${ai ? "connected" : "not connected"}\nX account: linked later\n\nYour AI key is encrypted at rest and never shown back to you.`;
};

bot.callbackQuery("settings", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply(settingsText(ctx.from?.id), { reply_markup: settingsMenu() }); });
bot.callbackQuery("ai_settings", async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx)) return; const connected = aiStore && aiStore.has(String(ctx.from.id)); const kb = new InlineKeyboard(); if (connected) kb.text("Remove AI key", "ai_remove"); else kb.text("Add OpenAI key", "ai_add"); kb.row().text("⬅️ Settings", "settings"); await ctx.reply(`🤖 AI Analysis\n\n${connected ? "Connected — AI analysis is available on token screens." : "Optional. The bot works normally without AI."}\n\nYour key is stored encrypted.`, { reply_markup: kb }); });
bot.callbackQuery("ai_add", async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx)) return; await ctx.reply("Send your OpenAI API key as your next message. It will be encrypted immediately.\n\nDo not send it in a group chat."); });
bot.callbackQuery("ai_remove", async ctx => { await ctx.answerCallbackQuery(); if (!guard(ctx) || !aiStore) return; aiStore.remove(String(ctx.from.id)); await ctx.reply("OpenAI key removed.", { reply_markup: settingsMenu() }); });
bot.callbackQuery("back", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply("Main menu", { reply_markup: menu() }); });
bot.callbackQuery("x_link", async ctx => { await ctx.answerCallbackQuery(); if (guard(ctx)) await ctx.reply("Send an X handle (for example @account) or profile URL as your next message. OAuth will be added when we need account data."); });

bot.on("message:text", async ctx => {
  if (!guard(ctx) || !aiStore) return;
  const text = ctx.message.text.trim();
  if (/^@?[A-Za-z0-9_]{1,15}$/.test(text) || /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\//i.test(text)) {
    const account = parseTwitterAccount(text);
    if (account) { await ctx.reply(`X account linked: @${account.handle}\n${account.url}`); return; }
  }
  if (/^sk-/i.test(text)) {
    try { aiStore.set(String(ctx.from.id), text); await ctx.reply("OpenAI key saved securely. It will not be displayed back to you.", { reply_markup: settingsMenu() }); }
    catch { await ctx.reply("Couldn't save that key. Check the server encryption configuration."); }
  }
});

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
    if (aiStore?.has(String(ctx.from.id))) keyboard.text("🤖 AI Analysis", `ai:${p.baseToken?.address ?? ""}`).row();
    if (p.url) keyboard.url("Open market", p.url).row();
    keyboard.text("🔎 Scan again", "scan");
    await ctx.reply(text, { reply_markup: keyboard });
  } catch (e) {
    console.error(e);
    await ctx.reply("Couldn't analyze that token right now.", { reply_markup: menu() });
  }
});

bot.callbackQuery(/^ai:(.+)$/, async ctx => {
  await ctx.answerCallbackQuery();
  if (!guard(ctx) || !aiStore) return;
  try {
    const pairs = await tokenPairs(ctx.match[1]);
    const p = pairs[0];
    if (!p) { await ctx.reply("Token data is no longer available."); return; }
    const prompt = buildTokenPrompt({ symbol: p.baseToken?.symbol ?? "Unknown", score: score(p), riskFlags: riskFlags(p) });
    const answer = await analyzeWithOpenAI(prompt, { apiKey: aiStore.get(String(ctx.from.id)) });
    await ctx.reply(`🤖 AI Analysis\n\n${answer}`);
  } catch (e) {
    console.error(e);
    await ctx.reply("AI analysis failed. Your key was not displayed.");
  }
});

bot.catch(e => console.error("Telegram bot error", e));
await bot.api.setMyCommands([
  { command: "start", description: "Open the main menu" },
  { command: "scan", description: "Find Solana candidates" },
  { command: "portfolio", description: "View portfolio" },
  { command: "settings", description: "Configure optional AI" },
  { command: "help", description: "Show help" }
]);
console.log("Solana Telegram Agent running");
await bot.start();
