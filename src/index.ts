import { Bot, InlineKeyboard } from "grammy";

type Pair = {
  chainId?: string; url?: string;
  baseToken?: { symbol?: string; name?: string; address?: string };
  priceUsd?: string; priceChange?: { h24?: number };
  volume?: { h24?: number }; liquidity?: { usd?: number }; fdv?: number;
  pairCreatedAt?: number; txns?: { h24?: { buys?: number; sells?: number } };
};

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedChatId = process.env.TELEGRAM_CHAT_ID;
if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
const bot = new Bot(token);

const money = (n?: number) => !Number.isFinite(n) ? "—" : n! >= 1e6 ? `$${(n!/1e6).toFixed(1)}M` : n! >= 1e3 ? `$${(n!/1e3).toFixed(1)}K` : `$${n!.toFixed(0)}`;
const age = (ts?: number) => {
  if (!ts) return "unknown";
  const h = Math.max(0, (Date.now() - ts) / 3_600_000);
  return h < 24 ? `${h.toFixed(0)}h` : `${(h / 24).toFixed(1)}d`;
};
const score = (p: Pair) => {
  const liq=p.liquidity?.usd??0, vol=p.volume?.h24??0, buys=p.txns?.h24?.buys??0, sells=p.txns?.h24?.sells??0, change=p.priceChange?.h24??0;
  let s=0;
  if(liq>=100000)s+=30; else if(liq>=25000)s+=22; else if(liq>=10000)s+=12;
  if(vol>=500000)s+=25; else if(vol>=100000)s+=18; else if(vol>=25000)s+=10;
  if(buys+sells>0&&buys>sells)s+=Math.min(20,Math.round(buys/(buys+sells)*20));
  if(change>0&&change<100)s+=10; else if(change>=100)s+=4;
  if(liq>0&&(p.fdv??0)/liq<100)s+=10;
  if(age(p.pairCreatedAt).endsWith("h")&&Number.parseFloat(age(p.pairCreatedAt))<2)s-=15;
  return Math.max(0,Math.min(100,s));
};
const guard = (ctx:{chat?:{id:number}}) => !allowedChatId || String(ctx.chat?.id)===allowedChatId;
const menu = () => new InlineKeyboard().text("🔎 Scan","scan").row().text("💼 Portfolio","portfolio").text("ℹ️ Help","help");

async function scan():Promise<Pair[]> {
  const r=await fetch("https://api.dexscreener.com/latest/dex/search?q=SOL");
  if(!r.ok) throw new Error(`DexScreener HTTP ${r.status}`);
  const d=await r.json() as {pairs?:Pair[]};
  return (d.pairs??[]).filter(p=>p.chainId==="solana"&&(p.liquidity?.usd??0)>=10000).sort((a,b)=>score(b)-score(a)).slice(0,5);
}
async function sendScan(ctx:any){
  await ctx.reply("🔎 Scanning Solana markets...");
  try{
    const pairs=await scan();
    if(!pairs.length){await ctx.reply("No candidates passed the basic liquidity filter.",{reply_markup:menu()});return;}
    for(const [i,p] of pairs.entries()){
      const buys=p.txns?.h24?.buys??0,sells=p.txns?.h24?.sells??0;
      const text=[`${i+1}. ${p.baseToken?.symbol??"Unknown"} — ${score(p)}/100`,`Liquidity: ${money(p.liquidity?.usd)}   Volume: ${money(p.volume?.h24)}`,`24h: ${p.priceChange?.h24?.toFixed(1)??"—"}%   Buys/Sells: ${buys}/${sells}`,`Age: ${age(p.pairCreatedAt)}   FDV: ${money(p.fdv)}`,p.url?`Market: ${p.url}`:"","⚠️ Research score only — not a buy signal."].filter(Boolean).join("\n");
      await ctx.reply(text,{reply_markup:new InlineKeyboard().text("Analyze",`analyze:${p.baseToken?.address??""}`)});
    }
  }catch(e){console.error(e);await ctx.reply("Couldn't fetch market data right now. Try again later.",{reply_markup:menu()});}
}

bot.command("start",async ctx=>{if(!guard(ctx))return;await ctx.reply("Solana Meme Agent\n\nSimple by design. I scan first; you stay in control.\n\nTrading is disabled for now.",{reply_markup:menu()});});
bot.command("scan",async ctx=>{if(guard(ctx))await sendScan(ctx);});
bot.command("portfolio",async ctx=>{if(guard(ctx))await ctx.reply("💼 No wallet is connected yet. Trading is disabled.",{reply_markup:menu()});});
bot.command("help",async ctx=>{if(guard(ctx))await ctx.reply("Use the buttons or /scan.\n\nThe bot never asks for a seed phrase or private key. Real trades will require explicit wallet approval.",{reply_markup:menu()});});
bot.callbackQuery("scan",async ctx=>{await ctx.answerCallbackQuery();if(guard(ctx))await sendScan(ctx);});
bot.callbackQuery("portfolio",async ctx=>{await ctx.answerCallbackQuery();if(guard(ctx))await ctx.reply("💼 No wallet is connected yet. Trading is disabled.",{reply_markup:menu()});});
bot.callbackQuery("help",async ctx=>{await ctx.answerCallbackQuery();if(guard(ctx))await ctx.reply("I scan public Solana market data and rank candidates using simple checks. Nothing is bought automatically.",{reply_markup:menu()});});
bot.callbackQuery(/^analyze:(.+)$/,async ctx=>{await ctx.answerCallbackQuery();if(guard(ctx))await ctx.reply("Detailed token analysis is coming next. For now, inspect the market link in the scan result.",{reply_markup:menu()});});
bot.catch(e=>console.error("Telegram bot error",e));
await bot.api.setMyCommands([{command:"start",description:"Open the main menu"},{command:"scan",description:"Find Solana candidates"},{command:"portfolio",description:"View portfolio"},{command:"help",description:"Show help"}]);
console.log("Solana Telegram Agent running");
await bot.start();
