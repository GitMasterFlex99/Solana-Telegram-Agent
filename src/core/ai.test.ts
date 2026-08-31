import { strict as assert } from "node:assert";
import test from "node:test";
import { analyzeWithAI, buildTokenPrompt } from "./ai.js";

function response(body: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("Ollama returns chat message content", async () => {
  let calledUrl = "";
  const result = await analyzeWithAI("test prompt", { provider: "ollama", model: "llama3.2" }, async (input) => {
    calledUrl = String(input);
    return response({ message: { role: "assistant", content: "local analysis" } });
  });
  assert.equal(calledUrl, "http://127.0.0.1:11434/api/chat");
  assert.equal(result, "local analysis");
});

test("Ollama failure is surfaced without fallback to cloud AI", async () => {
  await assert.rejects(
    () => analyzeWithAI("test", { provider: "ollama" }, async () => response({ error: "offline" }, false, 503)),
    /ollama HTTP 503/i
  );
});

test("OpenAI requires an API key", async () => {
  await assert.rejects(() => analyzeWithAI("test", { provider: "openai" }), /not configured/i);
});

test("token prompt explicitly forbids invented evidence", () => {
  const prompt = buildTokenPrompt({ symbol: "TEST", score: 50, riskFlags: ["low liquidity"] });
  assert.match(prompt, /using only the supplied evidence/i);
  assert.match(prompt, /Do not invent missing data/i);
  assert.match(prompt, /invalidation condition/i);
});
