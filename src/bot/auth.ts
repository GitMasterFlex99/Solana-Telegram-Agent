export type TelegramContextLike = { chat?: { id: number }; from?: { id: number } };

export function isAuthorized(ctx: TelegramContextLike, allowedChatId?: string): boolean {
  if (!allowedChatId) return true;
  return String(ctx.chat?.id ?? "") === allowedChatId;
}

export function requireAuthorization(ctx: TelegramContextLike, allowedChatId?: string): void {
  if (!isAuthorized(ctx, allowedChatId)) throw new Error("Unauthorized Telegram request");
}
