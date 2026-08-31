export type AIConfig = {
  provider?: "openai" | "ollama";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
};

export function hasAIKey(config: AIConfig): boolean {
  return config.provider === "ollama" || Boolean(config.apiKey?.trim());
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
  const value = data as { output_text?: unknown; output?: unknown; message?: { content?: unknown } };
  if (typeof value.output_text === "string" && value.output_text.trim()) return value.output_text.trim();
  if (typeof value.message?.content === "string" && value.message.content.trim()) return value.message.content.trim();
  if (!Array.isArray(value.output)) return undefined;
  const text = value.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
    .map((part: any) => typeof part?.text === "string" ? part.text : "")
    .filter(Boolean).join("\n").trim();
  return text || undefined;
}

export async function analyzeWithAI(prompt: string, config: AIConfig, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!hasAIKey(config)) throw new Error("AI is not configured");
  const provider = config.provider ?? "openai";
  const baseUrl = (config.baseUrl ?? (provider === "ollama" ? "http://127.0.0.1:11434" : "https://api.openai.com/v1")).replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const request = provider === "ollama"
      ? {
          url: `${baseUrl}/api/chat`,
          init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: config.model ?? "llama3.2", messages: [{ role: "user", content: prompt }], stream: false }) }
        }
      : {
          url: `${baseUrl}/responses`,
          init: { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey!.trim()}` }, body: JSON.stringify({ model: config.model ?? "gpt-5.6-luna", input: prompt, max_output_tokens: 350 }) }
        };
    const response = await fetchImpl(request.url, { ...request.init, signal: controller.signal });
    if (!response.ok) throw new Error(`${provider} HTTP ${response.status}`);
    const data = await response.json() as unknown;
    const text = extractOutputText(data);
    if (!text) throw new Error(`${provider} returned no text`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export const analyzeWithOpenAI = analyzeWithAI;
