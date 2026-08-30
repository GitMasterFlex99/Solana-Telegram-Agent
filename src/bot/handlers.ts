import { Bot } from "grammy";
import { mainMenu, settingsMenu } from "./keyboards.js";
import { isAuthorized } from "./auth.js";
import { helpText, tradingDisabledText } from "./responses.js";

export type HandlerDeps = {
  allowedChatId?: string;
  onScan: (ctx: any) => Promise<void>;
  onSettings: (ctx: any) => Promise<void>;
  onPortfolio: (ctx: any) => Promise<void>;
};

export function registerCommandHandlers(bot: Bot, deps: HandlerDeps): void {
  bot.command("start", async ctx => {
    if (!isAuthorized(ctx, deps.allowedChatId)) return;
    await ctx.reply("Solana Meme Agent\n\nSimple by design. I scan first; you stay in control.\n\nTrading is disabled for now.", { reply_markup: mainMenu() });
  });
  bot.command("scan", async ctx => { if (isAuthorized(ctx, deps.allowedChatId)) await deps.onScan(ctx); });
  bot.command("portfolio", async ctx => { if (isAuthorized(ctx, deps.allowedChatId)) await deps.onPortfolio(ctx); });
  bot.command("settings", async ctx => { if (isAuthorized(ctx, deps.allowedChatId)) await deps.onSettings(ctx); });
  bot.command("help", async ctx => { if (isAuthorized(ctx, deps.allowedChatId)) await ctx.reply(helpText, { reply_markup: mainMenu() }); });
}
