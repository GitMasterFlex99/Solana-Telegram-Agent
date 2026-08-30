import { InlineKeyboard } from "grammy";

export const mainMenu = () => new InlineKeyboard().text("Scan", "scan").row().text("Portfolio", "portfolio").text("Settings", "settings").row().text("Help", "help");
export const settingsMenu = (aiConnected: boolean) => {
  const kb = new InlineKeyboard().text(aiConnected ? "Remove AI key" : "Add OpenAI key", aiConnected ? "ai_remove" : "ai_add");
  return kb.row().text("Link X account", "x_link").row().text("Back", "back");
};
export const analysisMenu = (address: string, marketUrl?: string, aiConnected = false) => {
  const kb = new InlineKeyboard();
  if (aiConnected) kb.text("AI Analysis", `ai:${address}`).row();
  if (marketUrl) kb.url("Open market", marketUrl).row();
  return kb.text("Scan again", "scan");
};
