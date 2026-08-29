import { Bot, InlineKeyboard } from "grammy";

type Pair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  baseToken?: { symbol?: string; name?: string; address?: string };
  priceUsd?: string;
  priceChange?: { h1?: number; h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  pairCreatedAt?: number;
  txns?: { h24?: { buys?: number; sells?: number } };
};

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

function score(p: Pair) {
  const liq = p.liquidity?.usd ?? 0;
  const vol = p.volume?.h24 ?? 0;
  const buys = p.txns?.h24?.buys ?? 0;
  const sells = p.txns?.h24?.sells ?? 0;
  const change = p.priceChange?.h24 ?? 0;
  let s = 0;
  if (liq >= 100_000) s += 30; else if (liq >= 25_000) s += 22; else if (liq >= 10_000) s += 12;
  if (vol >= 500_000) s += 25; else if (vol >= 100_000) s += 18; else if (vol >= 25_000) s += 10;
  if (buys + sells > 0 && buys > sells) s += Math.min(20, Math.round(buys / (buys + sells) * 20));
  if (change > 0 && change < 100) s += 10; else if (change >= 100) s += 4;
  if (liq > 0 && (p.fdv ?? 0) / liq < 100) s += 10;
  if (age(p.pairCreatedAt).endsWith("h") && Number.parseFloat(age(p.pairCreatedAt)) < 2) s -= 15;
  return Math.max(0, Math.min(100, s));
}

function risk(p: Pair) {
  const liq = p.liquidity?.usd ?? 0;
  const vol = p.volume?.h24 ?? 0;
  const ageText = age(p.pairCreatedAt);
  const flags: string[] = [];
  if (liq < 25_000) flags.push("low liquidity");
  if (liq > 0 && vol / liq > 20) flags.push("very high volume/liquidity");
  if (ageText.endsWith("h") && Number.parseFloat(ageText) < 24) flags.push("very new pair");
  if ((p.priceChange?.h24 ?? 0) > 200) flags.push("extreme 24h move");
  if ((p.fdv ?? 0) > 0 && liq > 0 && (p.fdv! / liq) > 100) flags.push("high FDV/liquidity");
  return flags;
}

const guard = (ctx: { chat?: { id: number } }) => !allowedChatId || String(ctx.chat?.id) === allowedChatId;
const menu = () => new InlineKeyboard().text("🔎 Scan", "scan").row().text("💼 Portfolio", "portfolio").text("ℹ️ Help", "help");

async function scan(): Promise<Pair[]> {
  const r = await fetch("https://api.dexscreener.com/latest/dex/search?q=SOL");
  if (!r.ok) throw new Error(`DexScreener HTTP ${r.status}`);
  const d = await r.json() as { pairs?: Pair[] };
  return (d.pairs ?? [])
    .filter(p => p.chainId === "solana" && (p.liquidity?.usd ?? 0) >= 10_000)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5);
}

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
    const pairs = await scan();
    if (!pairs.length) { await ctx.reply("No candidates passed the basic liquidity filter.", { reply_markup: menu() }); return; }
    for (const [i, p] of pairs.entries()) {
      const buys = p.txns?.h24?.buys ?? 0;
      const sells = p.txns?.h24?.sells ?? 0;
      const flags = risk(p);
      const text = [
        `${i + 1}. ${p.baseToken?.symbol ?? "Unknown"} — ${score(p)}/100`,
        `Liquidity: ${money(p.liquidity?.usd)}   Volume: ${money(p.volume?.h24)}`,
        `24h: ${p.priceChange?.h24?.toFixed(1) ?? "—"}%   Buys/Sells: ${buys}/${sells}`,
        `Age: ${age(p.pairCreatedAt)}   FDV: ${money(p.fdv)}`,
        flags.length ? `⚠️ ${flags.join(", ")}` : "Risk flags: none from basic checks",
        p.url ? `Market: ${p.url}` : "",
        "Research score only — not a buy signal."
      ].filter(Boolean).join("\n");
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
  const address = ctx.match[1];
  try {
    const pairs = await tokenPairs(address);
    if (!pairs.length) { await ctx.reply("I couldn't find a Solana market for that token.", { reply_markup: menu() }); return; }
    const p = pairs[0];
    const flags = risk(p);
    const text = [
      `🔍 ${p.baseToken?.symbol ?? "Unknown"}`,
      p.baseToken?.name ? p.baseToken.name : "",
      `Score: ${score(p)}/100`,
      `Price: $${p.priceUsd ?? "—"}`,
      `Liquidity: ${money(p.liquidity?.usd)}`,
      `24h volume: ${money(p.volume?.h24)}`,
      `24h change: ${p.priceChange?.h24?.toFixed(1) ?? "—"}%`,
      `Age: ${age(p.pairCreatedAt)}`,
      flags.length ? `⚠️ Risk flags: ${flags.join(", ")}` : "✅ No basic risk flags detected",
      "",
      "This is market-data analysis, not a guarantee that the token is safe or profitable."
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
