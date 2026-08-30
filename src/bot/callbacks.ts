import { Bot } from "grammy";
import { isAuthorized } from "./auth.js";
import { mainMenu } from "./keyboards.js";

export type CallbackDeps = {
  allowedChatId?: string;
  aiStore?: { has(id: string): boolean; remove(id: string): void } | null;
  showSettings: (ctx: any) => Promise<void>;
  showScan: (ctx: any) => Promise<void>;
};

export function registerBasicCallbacks(bot: Bot, deps: CallbackDeps): void {
  bot.callbackQuery("settings", async ctx => {
    await ctx.answerCallbackQuery();
    if (isAuthorized(ctx, deps.allowedChatId)) await deps.showSettings(ctx);
  });
  bot.callbackQuery("back", async ctx => {
    await ctx.answerCallbackQuery();
    if (isAuthorized(ctx, deps.allowedChatId)) await ctx.reply("Main menu", { reply_markup: mainMenu() });
  });
  bot.callbackQuery("scan", async ctx => {
    await ctx.answerCallbackQuery();
    if (isAuthorized(ctx, deps.allowedChatId)) await deps.showScan(ctx);
  });
  bot.callbackQuery("ai_remove", async ctx => {
    await ctx.answerCallbackQuery();
    if (!isAuthorized(ctx, deps.allowedChatId) || !deps.aiStore) return;
    deps.aiStore.remove(String(ctx.from.id));
    await ctx.reply("OpenAI key removed.");
  });
}
