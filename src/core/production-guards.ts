export type ProductionConfig = {
  telegramToken?: string;
  telegramChatId?: string;
  aiEncryptionKey?: string;
};

export function validateProductionConfig(config: ProductionConfig): string[] {
  const errors: string[] = [];
  if (!config.telegramToken?.trim()) errors.push("TELEGRAM_BOT_TOKEN is required");
  if (config.telegramChatId !== undefined && !/^-?\d+$/.test(config.telegramChatId.trim())) errors.push("TELEGRAM_CHAT_ID must be a numeric Telegram chat ID");
  if (config.aiEncryptionKey !== undefined) {
    const value = config.aiEncryptionKey.trim();
    try {
      if (Buffer.from(value, "base64").length !== 32) throw new Error();
    } catch {
      errors.push("AI_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key when configured");
    }
  }
  return errors;
}
