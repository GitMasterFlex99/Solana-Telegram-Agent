export type AIConfig = { apiKey?: string; model?: string };

export function hasAIKey(config: AIConfig): boolean {
  return Boolean(config.apiKey?.trim());
}

export function buildTokenPrompt(input: { symbol: string; score: number; riskFlags: string[]; social?: string }): string {
  return [
    `Analyze ${input.symbol} using only the supplied evidence.`,
    `Research score: ${input.score}/100`,
    `Risk flags: ${input.riskFlags.length ? input.riskFlags.join(", ") : "none"}`,
    `Social signal: ${input.social ?? "unavailable"}`,
    "Give a short bull case, bear case, biggest uncertainty, and what would invalidate the thesis.",
    "Do not present the result as financial advice or a guaranteed prediction."
  ].join("\n");
}

export async function analyzeWithOpenAI(prompt: string, config: AIConfig, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!hasAIKey(config)) throw new Error("OpenAI API key is not configured");
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey!.trim()}` },
    body: JSON.stringify({ model: config.model ?? "gpt-5.4-mini", input: prompt, max_output_tokens: 350 }),
  });
  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
  const data = await response.json() as { output_text?: string };
  if (!data.output_text) throw new Error("OpenAI returned no text");
  return data.output_text;
}
