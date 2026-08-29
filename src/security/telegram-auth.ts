export type TelegramIdentity = {
  chatId?: number;
  userId?: number;
};

/**
 * Authorization is intentionally fail-closed. A deployment may allow one or
 * more Telegram user IDs, optionally constrained to a specific chat ID.
 * The environment values are configuration, not user-controlled input.
 */
export function isAuthorized(
  identity: TelegramIdentity,
  allowedUserIds: ReadonlySet<string>,
  allowedChatId?: string,
): boolean {
  if (!identity.userId || allowedUserIds.size === 0) return false;
  if (!allowedUserIds.has(String(identity.userId))) return false;
  if (allowedChatId && String(identity.chatId) !== allowedChatId) return false;
  return true;
}

export function parseAllowedUserIds(value: string | undefined): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id)),
  );
}
