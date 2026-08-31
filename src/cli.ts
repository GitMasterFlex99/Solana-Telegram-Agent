import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { discoverCandidates, fetchSolanaPairs } from "./core/market-discovery.js";
import { buildTokenPrompt, analyzeWithAI, type AIConfig } from "./core/ai.js";
import { researchScore, riskFlags, score } from "./core/scoring.js";
import { tokenPairs, isSolanaAddress } from "./services/market.js";

const money = (n?: number) => !Number.isFinite(n) ? "—" : n! >= 1e6 ? `$${(n! / 1e6).toFixed(1)}M` : n! >= 1e3 ? `$${(n! / 1e3).toFixed(1)}K` : `$${n!.toFixed(0)}`;
const age = (ts?: number) => { if (!ts) return "unknown"; const h = Math.max(0, (Date.now() - ts) / 3_600_000); return h < 24 ? `${h.toFixed(0)}h` : `${(h / 24).toFixed(1)}d`; };

function printPair(p: any, rank?: number) {
  const flags = riskFlags(p);
  const title = `${rank ? `#${rank} ` : ""}${p.baseToken?.symbol ?? "Unknown"}`;
  console.log(`\n${title} — ${researchScore(p)}/100`);
  console.log(`  ${p.baseToken?.name ?? "Unknown token"}`);
  console.log(`  Price       $${p.priceUsd ?? "—"}`);
  console.log(`  Liquidity   ${money(p.liquidity?.usd)}`);
  console.log(`  24h volume  ${money(p.volume?.h24)}`);
  console.log(`  24h change  ${p.priceChange?.h24?.toFixed(1) ?? "—"}%`);
  console.log(`  Age         ${age(p.pairCreatedAt)}`);
  console.log(`  Market      ${score(p)}/100`);
  console.log(`  Risk        ${flags.length ? flags.join(", ") : "no basic flags"}`);
  console.log(`  CA          ${p.baseToken?.address ?? "—"}`);
  if (p.url) console.log(`  Market      ${p.url}`);
}

async function scan() {
  console.log("Scanning Solana markets…");
  const candidates = discoverCandidates(await fetchSolanaPairs()).sort((a, b) => researchScore(b) - researchScore(a)).slice(0, 5);
  if (!candidates.length) { console.log("No strong candidates found."); return; }
  console.log(`Found ${candidates.length} candidates.`);
  candidates.forEach((p, i) => printPair(p, i + 1));
}

async function analyze(address: string, ai = false) {
  if (!isSolanaAddress(address)) throw new Error("Invalid Solana token address.");
  const pairs = await tokenPairs(address);
  if (!pairs.length) throw new Error("No usable Solana market found for that address.");
  const p = pairs[0];
  printPair(p);
  if (ai) {
    const provider = (process.env.AI_PROVIDER ?? "ollama") as "ollama" | "openai";
    const config: AIConfig = { provider, apiKey: process.env.OPENAI_API_KEY, model: process.env.AI_MODEL, baseUrl: process.env.AI_BASE_URL };
    console.log("\nAI analysis…");
    console.log(await analyzeWithAI(buildTokenPrompt({ symbol: p.baseToken?.symbol ?? "Unknown", score: researchScore(p), riskFlags: riskFlags(p), marketContext: `Price ${p.priceUsd ?? "unknown"}; liquidity ${money(p.liquidity?.usd)}; 24h volume ${money(p.volume?.h24)}; 24h change ${p.priceChange?.h24 ?? "unknown"}%` }), config));
  }
}

async function main() {
  const [command, value] = process.argv.slice(2);
  try {
    if (command === "scan") return await scan();
    if (command === "analyze") return await analyze(value ?? "");
    if (command === "ai") return await analyze(value ?? "", true);
    if (command === "help" || !command) {
      console.log("Solana Research Agent\n\nCommands:\n  scan                  Find current Solana candidates\n  analyze <CA>          Analyze a token by contract address\n  ai <CA>               Analyze a token with configured AI\n  help                  Show this help\n\nAI:\n  Ollama is the default local provider. Set AI_MODEL to change the model.\n  For OpenAI, set AI_PROVIDER=openai and OPENAI_API_KEY.\n");
      return;
    }
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

await main();
