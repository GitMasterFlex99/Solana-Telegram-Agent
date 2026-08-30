export type ProductionConfig = {
  telegramToken?: string;
  telegramChatId?: string;
  aiEncryptionKey?: string;
};

export function validateProductionConfig(config: ProductionConfig): string[] {
  const errors: string[] = [];
  if (!config.telegramToken?.trim()) errors.push("TELEGRAM_BOT_TOKEN is required");
  if (config.telegramChatId !== undefined && !/^-?\d+$/.test(config.telegramChatId.trim())) errors.push("TELEGRAM_CHAT_ID must be a numeric Telegram chat ID");
  if (config.aiEncryptionKey !== undefined && config.aiEncryptionKey.trim().length < 32) errors.push("AI_KEY_ENCRYPTION_KEY must be at least 32 characters when configured");
  return errors;
}
