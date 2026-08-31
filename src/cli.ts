import { discoverCandidates, fetchSolanaPairs, type DiscoveredPair } from "./core/market-discovery.js";
import { buildTokenPrompt, analyzeWithAI, type AIConfig } from "./core/ai.js";
import { researchScore, riskFlags, score } from "./core/scoring.js";
import { tokenPairs, isSolanaAddress } from "./services/market.js";
import { fetchXSignal } from "./services/x-signals.js";
import { WatchlistStore } from "./core/watchlist-store.js";
import { AlertStateStore } from "./core/alert-state-store.js";
import { detectAlertEvents, snapshotFor } from "./core/alert-rules-v2.js";
import { mapWithConcurrency } from "./core/concurrency.js";

type Pair = DiscoveredPair & { priceChange?: { h1?: number; h24?: number } };
const LOCAL_USER_ID = 0;
const money = (n?: number) => !Number.isFinite(n) ? "—" : n! >= 1e6 ? `$${(n! / 1e6).toFixed(1)}M` : n! >= 1e3 ? `$${(n! / 1e3).toFixed(1)}K` : `$${n!.toFixed(0)}`;
const age = (ts?: number) => { if (!ts) return "unknown"; const h = Math.max(0, (Date.now() - ts) / 3_600_000); return h < 24 ? `${h.toFixed(0)}h` : `${(h / 24).toFixed(1)}d`; };

function bestPair(pairs: Pair[]): Pair { return pairs.reduce((best, p) => ((p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) || ((p.liquidity?.usd ?? 0) === (best.liquidity?.usd ?? 0) && (p.volume?.h24 ?? 0) > (best.volume?.h24 ?? 0))) ? p : best); }

async function enrichSocial(pairs: DiscoveredPair[]): Promise<Array<{ pair: DiscoveredPair; social: Awaited<ReturnType<typeof fetchXSignal>> }>> {
  if (!process.env.X_BEARER_TOKEN?.trim()) return pairs.map(pair => ({ pair, social: { available: false, score: 0, mentions: 0, independentAccounts: 0, earlyMentions: 0, evidenceMentions: 0, lateMentions: 0, promotionalMentions: 0, credibleAccounts: 0, summary: "X signal unavailable", reason: "X_BEARER_TOKEN not configured" } }));
  return mapWithConcurrency(pairs, 3, async pair => ({ pair, social: await fetchXSignal(pair.baseToken?.symbol ?? "", pair.baseToken?.address ?? "") }));
}

function printPair(p: Pair, rank?: number, socialScore?: number, socialSummary?: string) {
  const flags = riskFlags(p);
  const finalScore = researchScore(p, socialScore ?? 0);
  console.log(`\n${rank ? `#${rank} ` : ""}${p.baseToken?.symbol ?? "Unknown"} — ${finalScore}/100`);
  console.log(`  ${p.baseToken?.name ?? "Unknown token"}`);
  console.log(`  Price       $${p.priceUsd ?? "—"}`);
  console.log(`  Liquidity   ${money(p.liquidity?.usd)}`);
  console.log(`  24h volume  ${money(p.volume?.h24)}`);
  console.log(`  24h change  ${p.priceChange?.h24?.toFixed(1) ?? "—"}%`);
  console.log(`  Age         ${age(p.pairCreatedAt)}`);
  console.log(`  Market      ${score(p)}/100`);
  console.log(`  Risk        ${flags.length ? flags.join(", ") : "no basic flags"}`);
  if (socialScore !== undefined) console.log(`  X           ${socialScore}/100 — ${socialSummary ?? "limited signal"}`);
  console.log(`  CA          ${p.baseToken?.address ?? "—"}`);
  if (p.url) console.log(`  Market      ${p.url}`);
}

async function scan() {
  console.log("Scanning Solana markets…");
  const candidates = discoverCandidates(await fetchSolanaPairs());
  const enriched = await enrichSocial(candidates.slice(0, 20));
  const ranked = enriched.sort((a, b) => researchScore(b.pair, b.social.available ? b.social.score : 0) - researchScore(a.pair, a.social.available ? a.social.score : 0)).slice(0, 5);
  if (!ranked.length) { console.log("No strong candidates found."); return; }
  console.log(`Found ${ranked.length} candidates.`);
  ranked.forEach((item, i) => printPair(item.pair, i + 1, item.social.available ? item.social.score : undefined, item.social.summary));
}

async function analyze(address: string, ai = false) {
  if (!isSolanaAddress(address)) throw new Error("Invalid Solana token address.");
  const pairs = await tokenPairs(address);
  if (!pairs.length) throw new Error("No usable Solana market found for that address.");
  const p = bestPair(pairs);
  const social = await fetchXSignal(p.baseToken?.symbol ?? "", address);
  printPair(p, undefined, social.available ? social.score : undefined, social.summary);
  if (ai) {
    const provider = (process.env.AI_PROVIDER ?? "ollama") as "ollama" | "openai";
    const config: AIConfig = { provider, apiKey: process.env.OPENAI_API_KEY, model: process.env.AI_MODEL, baseUrl: process.env.AI_BASE_URL };
    console.log("\nAI analysis…");
    const prompt = buildTokenPrompt({ symbol: p.baseToken?.symbol ?? "Unknown", score: researchScore(p, social.available ? social.score : 0), riskFlags: riskFlags(p), social: social.available ? `${social.score}/100 — ${social.summary}` : "unavailable", marketContext: `Price ${p.priceUsd ?? "unknown"}; liquidity ${money(p.liquidity?.usd)}; 24h volume ${money(p.volume?.h24)}; 24h change ${p.priceChange?.h24 ?? "unknown"}%` });
    console.log(await analyzeWithAI(prompt, config));
  }
}

async function watch(address: string) {
  if (!isSolanaAddress(address)) throw new Error("Invalid Solana token address.");
  const pairs = await tokenPairs(address);
  if (!pairs.length) throw new Error("No usable Solana market found for that address.");
  const p = bestPair(pairs);
  const store = new WatchlistStore();
  const added = await store.add(LOCAL_USER_ID, address, p.baseToken?.symbol);
  console.log(added ? `Watching ${p.baseToken?.symbol ?? address}.` : "That token is already being watched.");
}

async function unwatch(address: string) {
  if (!isSolanaAddress(address)) throw new Error("Invalid Solana token address.");
  const removed = await new WatchlistStore().remove(LOCAL_USER_ID, address);
  console.log(removed ? "Removed from watchlist." : "That token is not being watched.");
}

async function watchlist() {
  const items = await new WatchlistStore().list(LOCAL_USER_ID);
  if (!items.length) { console.log("Watchlist is empty."); return; }
  console.log("Watchlist:");
  items.forEach((item, i) => console.log(`${i + 1}. ${item.label ?? "Unknown"} — ${item.address}`));
}

async function monitor(intervalMs = Number(process.env.WATCH_INTERVAL_MS ?? 5 * 60_000)) {
  if (!Number.isFinite(intervalMs) || intervalMs < 30_000) throw new Error("WATCH_INTERVAL_MS must be at least 30000 milliseconds");
  const watchlists = new WatchlistStore();
  const states = new AlertStateStore();
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const items = await watchlists.list(LOCAL_USER_ID);
      await mapWithConcurrency(items, 3, async item => {
        try {
          const pair = bestPair(await tokenPairs(item.address));
          const current = snapshotFor({ opportunity: researchScore(pair), momentum: Math.max(0, Math.min(100, 50 + (pair.priceChange?.h24 ?? 0) / 2)), priceChange24h: pair.priceChange?.h24 ?? 0, riskScore: Math.min(100, riskFlags(pair).length * 20), liquidityUsd: pair.liquidity?.usd, volume24hUsd: pair.volume?.h24 });
          const key = item.address;
          const previous = await states.get(key);
          await states.set(key, current);
          const events = detectAlertEvents(previous, current);
          if (events.length) console.log(`\nALERT ${pair.baseToken?.symbol ?? item.address}\n${events.map(e => `- ${e.message}`).join("\n")}\nScore: ${current.opportunity}/100`);
        } catch (error) { console.error(`Monitor failed for ${item.address}: ${error instanceof Error ? error.message : String(error)}`); }
      });
    } finally { running = false; }
  };
  console.log(`Monitoring ${await watchlists.list(LOCAL_USER_ID).then(x => x.length)} token(s) every ${Math.round(intervalMs / 1000)}s. Press Ctrl+C to stop.`);
  await tick();
  const timer = setInterval(() => void tick(), intervalMs);
  await new Promise<void>(resolve => process.once("SIGINT", () => { clearInterval(timer); resolve(); }));
}

function help() {
  console.log(`Solana Research Agent\n\nCommands:\n  scan                    Scan and rank Solana candidates\n  analyze <CA>            Research a token by contract address\n  ai <CA>                 Research a token and run AI analysis\n  watch <CA>              Add a token to the local watchlist\n  unwatch <CA>            Remove a token from the watchlist\n  watchlist               Show watched tokens\n  monitor                 Monitor watched tokens for meaningful changes\n  help                    Show this help\n\nAI:\n  Ollama is the default local provider. Default model: llama3.2\n  Set AI_MODEL to change it.\n  OpenAI: AI_PROVIDER=openai OPENAI_API_KEY=...\n\nOptional:\n  X_BEARER_TOKEN=...      Enable X signals\n  WATCH_INTERVAL_MS=...   Monitoring interval; minimum 30000\n`);
}

async function main() {
  const [command, value] = process.argv.slice(2);
  try {
    if (command === "scan") return await scan();
    if (command === "analyze") return await analyze(value ?? "");
    if (command === "ai") return await analyze(value ?? "", true);
    if (command === "watch") return await watch(value ?? "");
    if (command === "unwatch") return await unwatch(value ?? "");
    if (command === "watchlist") return await watchlist();
    if (command === "monitor") return await monitor();
    if (command === "help" || !command) return help();
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

await main();
