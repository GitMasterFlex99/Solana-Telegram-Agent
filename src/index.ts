import { Bot, InlineKeyboard } from "grammy";
import { assessRisk } from "./core/risk.js";
import { isAuthorized, parseAllowedUserIds } from "./security/telegram-auth.js";
import { RateLimiter } from "./security/rate-limit.js";

type Pair = {
  chainId?: string;
  url?: string;
  baseToken?: { symbol?: string; name?: string; address?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  pairCreatedAt?: number;
  txns?: { h24?: { buys?: number; sells?: number } };
};

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatId = process.env.TELEGRAM_CHAT_ID;
const allowedUserIds = parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS);
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (allowedUserIds.size === 0) throw new Error("Missing TELEGRAM_ALLOWED_USER_IDS");

const bot = new Bot(token);
const limiter = new RateLimiter(10_000, 5);
const scannedPairs = new Map<string, Pair>();
const MAX_SCANNED_PAIRS = 50;

function guard(ctx: { chat?: { id: number }; from?: { id: number } }) {
  if (!isAuthorized({ chatId: ctx.chat?.id, userId: ctx.from?.id }, allowedUserIds, allowedChatId)) return false;
  const key = `${ctx.from?.id}:${ctx.chat?.id ?? "private"}`;
  return !limiter.isLimited(key);
}

function rememberPair(pair: Pair) {
  const address = pair.baseToken?.address;
  if (!address) return;
  scannedPairs.delete(address);
  scannedPairs.set(address, pair);
  while (scannedPairs.size > MAX_SCANNED_PAIRS) {
    const oldest = scannedPairs.keys().next().value;
    if (oldest) scannedPairs.delete(oldest);
    else break;
  }
}

const money = (n?: number) => {
  if (!Number.isFinite(n)) return "—";
  if (n! >= 1e6) return `$${(n! / 1e6).toFixed(1)}M`;
  if (n! >= 1e3) return `$${(n! / 1e3).toFixed(1)}K`;
  return `$${n!.toFixed(0)}`;
};

const age = (ts?: number) => {
  if (!ts) return "unknown";
  const h = Math.max(0, (Date.now() - ts) / 3_600_000);
  return h < 24 ? `${h.toFixed(0)}h` : `${(h / 24).toFixed(1)}d`;
};

const score = (p: Pair) => {
  const liq = p.liquidity?.usd ?? 0;
  const vol = p.volume?.h24 ?? 0;
  const buys = p.txns?.h24?.buys ?? 0;
  const sells = p.txns?.h24?.sells ?? 0;
  const change = p.priceChange?.h24 ?? 0;
  let s = 0;
  if (liq >= 100_000) s += 30;
  else if (liq >= 25_000) s += 22;
  else if (liq >= 10_000) s += 12;
  if (vol >= 500_000) s += 25;
  else if (vol >= 100_000) s += 18;
  else if (vol >= 25_000) s += 10;
  if (buys + sells > 0 && buys > sells) s += Math.min(20, Math.round((buys / (buys + sells)) * 20));
  if (change > 0 && change < 100) s += 10;
  else if (change >= 100) s += 4;
  if (liq > 0 && (p.fdv ?? 0) / liq < 100) s += 10;
  const hours = p.pairCreatedAt ? (Date.now() - p.pairCreatedAt) / 3_600_000 : Infinity;
  if (hours < 2) s -= 15;
  return Math.max(0, Math.min(100, s));
};

const menu = () => new InlineKeyboard()
  .text("🔎 Scan", "scan")
  .row()
  .text("💼 Portfolio", "portfolio")
  .text("ℹ️ Help", "help");

async function scan(): Promise<Pair[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch("https://api.dexscreener.com/latest/dex/search?q=SOL", { signal: controller.signal });
    if (!response.ok) throw new Error("Market data unavailable");
    const data = await response.json() as { pairs?: Pair[] };
    if (!Array.isArray(data.pairs)) return [];
    return data.pairs
      .filter((pair) => pair.chainId === "solana" && (pair.liquidity?.usd ?? 0) >= 10_000)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 5);
  } finally {
    clearTimeout(timeout);
  }
}

async function sendScan(ctx: any) {
  await ctx.reply("🔎 Scanning Solana markets...");
  try {
    const pairs = await scan();
    if (!pairs.length) {
      await ctx.reply("No candidates passed the basic liquidity filter.", { reply_markup: menu() });
      return;
    }
    for (const [i, pair] of pairs.entries()) {
      rememberPair(pair);
      const buys = pair.txns?.h24?.buys ?? 0;
      const sells = pair.txns?.h24?.sells ?? 0;
      const address = pair.baseToken?.address;
      const text = [
        `${i + 1}. ${pair.baseToken?.symbol ?? "Unknown"} — ${score(pair)}/100`,
        `Liquidity: ${money(pair.liquidity?.usd)}   Volume: ${money(pair.volume?.h24)}`,
        `24h: ${pair.priceChange?.h24?.toFixed(1) ?? "—"}%   Buys/Sells: ${buys}/${sells}`,
        `Age: ${age(pair.pairCreatedAt)}   FDV: ${money(pair.fdv)}`,
        pair.url ? `Market: ${pair.url}` : "",
        "⚠️ Research score only — not a buy signal.",
      ].filter(Boolean).join("\n");
      const keyboard = address
        ? new InlineKeyboard().text("Analyze", `analyze:${address}`)
        : menu();
      await ctx.reply(text, { reply_markup: keyboard });
    }
    await ctx.reply("Use Analyze for the risk breakdown. Trading is disabled.", { reply_markup: menu() });
  } catch {
    console.error("market scan failed");
    await ctx.reply("Couldn't fetch market data right now. Try again later.", { reply_markup: menu() });
  }
}

function riskForPair(pair: Pair) {
  return assessRisk({
    liquidityUsd: pair.liquidity?.usd ?? 0,
    volume24hUsd: pair.volume?.h24 ?? 0,
    buys24h: pair.txns?.h24?.buys ?? 0,
    sells24h: pair.txns?.h24?.sells ?? 0,
    priceChange24h: pair.priceChange?.h24 ?? 0,
    fdvUsd: pair.fdv ?? 0,
    ageHours: pair.pairCreatedAt ? Math.max(0, (Date.now() - pair.pairCreatedAt) / 3_600_000) : 999_999,
  });
}

bot.command("start", async (ctx) => {
  if (!guard(ctx)) return;
  await ctx.reply("Solana Meme Agent\n\nSimple by design. I scan first; you stay in control.\n\nTrading is disabled for now.", { reply_markup: menu() });
});

bot.command("scan", async (ctx) => {
  if (guard(ctx)) await sendScan(ctx);
});

bot.command("portfolio", async (ctx) => {
  if (guard(ctx)) await ctx.reply("💼 No wallet is connected yet. Trading is disabled.", { reply_markup: menu() });
});

bot.command("help", async (ctx) => {
  if (guard(ctx)) await ctx.reply("Use the buttons or /scan.\n\nThe bot never asks for a seed phrase or private key.\n\nWhen trading is enabled, use a separate trading wallet in Phantom or another mainstream Solana wallet. Do not connect your main wallet. Keep only what you are comfortable losing in the trading wallet.", { reply_markup: menu() });
});

bot.callbackQuery("scan", async (ctx) => {
  if (!guard(ctx)) { await ctx.answerCallbackQuery({ text: "Not authorized or rate limited." }); return; }
  await ctx.answerCallbackQuery();
  await sendScan(ctx);
});

bot.callbackQuery("portfolio", async (ctx) => {
  if (!guard(ctx)) { await ctx.answerCallbackQuery({ text: "Not authorized or rate limited." }); return; }
  await ctx.answerCallbackQuery();
  await ctx.reply("💼 No wallet is connected yet. Trading is disabled.", { reply_markup: menu() });
});

bot.callbackQuery("help", async (ctx) => {
  if (!guard(ctx)) { await ctx.answerCallbackQuery({ text: "Not authorized or rate limited." }); return; }
  await ctx.answerCallbackQuery();
  await ctx.reply("I scan public Solana market data and rank candidates using simple checks. Nothing is bought automatically.\n\nFor future trading: create a separate trading wallet in Phantom (or another mainstream Solana wallet). Do not connect your main wallet. Never share a seed phrase or private key.", { reply_markup: menu() });
});

bot.callbackQuery(/^analyze:(.+)$/, async (ctx) => {
  if (!guard(ctx)) { await ctx.answerCallbackQuery({ text: "Not authorized or rate limited." }); return; }
  await ctx.answerCallbackQuery();
  const address = ctx.match[1];
  const pair = scannedPairs.get(address);
  if (!pair) {
    await ctx.reply("That scan result has expired. Run /scan again.", { reply_markup: menu() });
    return;
  }
  scannedPairs.delete(address);
  scannedPairs.set(address, pair);
  const risk = riskForPair(pair);
  const flags = risk.flags.length ? risk.flags.map((flag) => `• ${flag}`).join("\n") : "• No basic risk flags triggered";
  const text = [
    `🔎 ${pair.baseToken?.symbol ?? "Unknown"} analysis`,
    `Risk: ${risk.label} (${risk.score}/100)`,
    `Liquidity: ${money(pair.liquidity?.usd)}`,
    `24h volume: ${money(pair.volume?.h24)}`,
    `24h change: ${pair.priceChange?.h24?.toFixed(1) ?? "—"}%`,
    `Pair age: ${age(pair.pairCreatedAt)}`,
    "",
    "Risk flags:",
    flags,
    "",
    "⚠️ This is a screening tool, not financial advice or a buy signal.",
  ].join("\n");
  await ctx.reply(text, { reply_markup: menu() });
});

bot.catch((error) => console.error("Telegram bot error", error));
await bot.api.setMyCommands([
  { command: "start", description: "Open the main menu" },
  { command: "scan", description: "Find Solana candidates" },
  { command: "portfolio", description: "View portfolio" },
  { command: "help", description: "Show help" },
]);
console.log("Solana Telegram Agent running");
await bot.start();
