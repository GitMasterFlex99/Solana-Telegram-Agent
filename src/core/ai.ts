export type AIConfig = {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
};

export function hasAIKey(config: AIConfig): boolean {
  return Boolean(config.apiKey?.trim());
}

export function buildTokenPrompt(input: {
  symbol: string;
  score: number;
  riskFlags: string[];
  social?: string;
  marketContext?: string;
}): string {
  return [
    `Analyze ${input.symbol} using only the supplied evidence.`,
    `Research score: ${input.score}/100`,
    `Risk flags: ${input.riskFlags.length ? input.riskFlags.join(", ") : "none"}`,
    `Social signal: ${input.social ?? "unavailable"}`,
    `Market context: ${input.marketContext ?? "unavailable"}`,
    "Give four short sections: bull case, bear case, biggest uncertainty, invalidation condition.",
    "Separate observed facts from interpretation. Do not invent missing data.",
    "Do not present the result as financial advice or a guaranteed prediction."
  ].join("\n");
}

function extractOutputText(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const value = data as { output_text?: unknown; output?: unknown };
  if (typeof value.output_text === "string" && value.output_text.trim()) return value.output_text.trim();
  if (!Array.isArray(value.output)) return undefined;
  const text = value.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
    .map((part: any) => typeof part?.text === "string" ? part.text : "")
    .filter(Boolean).join("\n").trim();
  return text || undefined;
}

export async function analyzeWithOpenAI(prompt: string, config: AIConfig, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!hasAIKey(config)) throw new Error("OpenAI API key is not configured");
  const baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetchImpl(`${baseUrl}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey!.trim()}` },
    body: JSON.stringify({ model: config.model ?? "gpt-5.6-luna", input: prompt, max_output_tokens: 350 }),
  });
  if (!response.ok) throw new Error(`AI provider HTTP ${response.status}`);
  const data = await response.json() as unknown;
  const text = extractOutputText(data);
  if (!text) throw new Error("AI provider returned no text");
  return text;
}
