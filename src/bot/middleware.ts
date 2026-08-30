import type { Context, NextFunction } from "grammy";

export function createAuthorizationMiddleware(allowedChatId?: string) {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    if (allowedChatId && String(ctx.chat?.id) !== allowedChatId) return;
    await next();
  };
}
