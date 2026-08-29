export type AiProvider = "openai";

export type AiInput = {
  symbol: string;
  snapshot: Record<string, unknown>;
  risk: Record<string, unknown>;
  social?: Record<string, unknown>;
};

export async function analyzeWithOpenAI(apiKey: string, input: AiInput): Promise<string> {
  if (!apiKey.trim()) throw new Error("Missing API key");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: "Analyze crypto market data conservatively. Do not make a guaranteed prediction or claim certainty. Separate facts from interpretation. Return: What looks good, Main risks, What would change the view, Verdict (Watch/Pass/Research more). Keep it concise.",
        },
        { role: "user", content: JSON.stringify(input) },
      ],
      max_output_tokens: 350,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
  const data = await response.json() as { output_text?: string };
  return data.output_text?.trim() || "No AI analysis returned.";
}
