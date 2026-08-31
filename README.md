# Solana Research Agent

A local, read-only Solana market research agent for Windows Terminal and Linux.

The interface is intentionally small. The intelligence happens behind the scenes: market discovery, liquidity/volume analysis, risk scoring, optional X signals, and optional AI analysis through local Ollama or a user's own OpenAI API key.

## Safety

This project is research-only.

- No wallet connection.
- No seed phrases or private keys.
- No transaction signing.
- No automated trading.
- No crypto mining, phishing, card fraud/testing, spam, pirated content, or other illegal functionality.
- Public market data is treated as evidence, not a guarantee of safety or profit.

## What it does

### Market discovery

`scan` uses public DexScreener market data to find Solana candidates. It removes native SOL, duplicate token markets, explicitly dangerous markets, very young pairs, and markets below the basic liquidity/volume floor.

Ranking considers liquidity, volume, volume/liquidity, transaction balance, momentum, pair age and FDV/liquidity. Extreme risk conditions can cap the final research score instead of allowing hype to overwhelm risk.

### Token research

`analyze <CA>` accepts a Solana contract address and selects the strongest available Solana market for that token. It reports price, liquidity, volume, momentum, age, market score, research score and risk flags.

### Optional X signals

Set `X_BEARER_TOKEN` to enable recent public X-post analysis. X is supporting evidence only and has a small influence on the final score. Without it, the core workflow remains fully usable.

### Optional AI

Ollama is the default local AI provider, so AI analysis can run without sending the research to a paid cloud API.

OpenAI is also supported when explicitly selected with `AI_PROVIDER=openai` and `OPENAI_API_KEY`.

AI receives the observed market evidence and is instructed to separate facts from interpretation, identify uncertainty, and give an invalidation condition. It does not place trades or promise outcomes.

### Local watchlist and alerts

```text
watch <CA>
unwatch <CA>
watchlist
monitor
```

Watchlist state is stored locally in `data/watchlists.json`. Alert state is stored locally in `data/alert-state.json`. Writes are validated and atomic. `monitor` checks watched tokens periodically and prints meaningful threshold changes to the terminal.

## Requirements

- Node.js 22+
- Windows Terminal, PowerShell, Command Prompt, or Linux shell
- Internet connection for public market/X data
- Ollama only if you want local AI analysis

## Install

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Run

```bash
npm start -- scan
npm start -- analyze <SOLANA_TOKEN_CA>
npm start -- ai <SOLANA_TOKEN_CA>
npm start -- watch <SOLANA_TOKEN_CA>
npm start -- unwatch <SOLANA_TOKEN_CA>
npm start -- watchlist
npm start -- monitor
npm start -- help
```

For a compiled build:

```bash
npm run build
node dist/index.js scan
```

## Ollama

Install Ollama separately, make sure it is running, and pull a model:

```bash
ollama pull llama3.2
```

The agent defaults to:

```text
AI_PROVIDER=ollama
AI_MODEL=llama3.2
AI_BASE_URL=http://127.0.0.1:11434
```

You can change the model or local Ollama endpoint through environment variables.

## OpenAI (optional)

```text
AI_PROVIDER=openai
OPENAI_API_KEY=your-key
```

Do not commit API keys. Environment variables are preferred.

## X (optional)

```text
X_BEARER_TOKEN=your-token
```

The X integration is optional. If it is unavailable or fails, market research continues without it.

## Windows PowerShell example

```powershell
$env:AI_PROVIDER="ollama"
$env:AI_MODEL="llama3.2"
npm start -- scan
```

## Linux example

```bash
export AI_PROVIDER=ollama
export AI_MODEL=llama3.2
npm start -- scan
```

## Architecture

```text
Windows Terminal / Linux shell
             |
             v
          Local CLI
             |
      +------+------+
      |             |
 Market data     Local state
      |          watch/alerts
      v             |
 Discovery -> Risk -> Scoring
      |             |
      +------> X --+
             |
             v
       Optional AI
      Ollama/OpenAI
             |
             v
       Research output
```

The project deliberately avoids a large UI. New functionality should make the existing research workflow more accurate, safer or more reliable before adding new surface area.
