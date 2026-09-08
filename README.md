# Solana Research Agent

A local, read-only Solana market research agent for Windows Terminal and Linux.

## Features

- Discovers Solana markets using public market data
- Analyzes liquidity, volume, momentum, pair age and risk signals
- Produces a research score with explicit risk flags
- Optional recent X signals as supporting evidence
- Optional local AI analysis through Ollama
- Optional OpenAI analysis when explicitly configured
- Local watchlists and threshold-based alerts
- No wallet connection, private keys or transaction signing

## Research-first design

The project is intentionally **research-only**. It does not place trades or promise outcomes. Market data is treated as evidence, and AI output is instructed to separate observed facts from interpretation and uncertainty.

## Requirements

- Node.js 22+
- Windows Terminal, PowerShell, Command Prompt or Linux shell
- Internet connection
- Ollama is optional and only needed for local AI analysis

## Quick start

```bash
npm install
npm run typecheck
npm test
npm run build
npm start -- scan
```

Analyze a token:

```bash
npm start -- analyze <SOLANA_TOKEN_CA>
```

Manage a local watchlist:

```bash
npm start -- watch <SOLANA_TOKEN_CA>
npm start -- watchlist
npm start -- monitor
```

## AI

The default AI provider is local Ollama. OpenAI can be selected explicitly through environment variables. API keys should never be committed to the repository.

## Architecture

```text
Windows Terminal / Linux shell
            |
            v
         Local CLI
            |
     +------+------+
     |             |
 Market data    Local state
     |          watch/alerts
     v             |
 Discovery → Risk → Scoring
     |             |
     +------→ X ---+
            |
            v
       Optional AI
            |
            v
      Research output
```

## Project goal

Build a practical command-line research tool that combines public market data, source-backed context, risk scoring and optional local AI without turning the application into an automated trading system.
