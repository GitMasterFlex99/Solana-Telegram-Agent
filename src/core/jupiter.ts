const JUPITER_QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote";

export type QuoteRequest = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
};

export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  slippageBps: number;
  routePlan?: unknown[];
  contextSlot?: number;
  timeTaken?: number;
};

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function validateQuoteRequest(q: QuoteRequest): void {
  if (!BASE58.test(q.inputMint) || !BASE58.test(q.outputMint)) throw new Error("Invalid Solana mint address");
  if (!/^\d+$/.test(q.amount) || BigInt(q.amount) <= 0n) throw new Error("Invalid amount");
  const slippage = q.slippageBps ?? 100;
  if (!Number.isInteger(slippage) || slippage < 0 || slippage > 100) throw new Error("Slippage exceeds policy");
}

export async function getJupiterQuote(q: QuoteRequest): Promise<JupiterQuote> {
  validateQuoteRequest(q);
  const params = new URLSearchParams({
    inputMint: q.inputMint,
    outputMint: q.outputMint,
    amount: q.amount,
    slippageBps: String(q.slippageBps ?? 100),
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${JUPITER_QUOTE_URL}?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Jupiter quote HTTP ${response.status}`);
    const data = await response.json() as JupiterQuote;
    if (data.inputMint !== q.inputMint || data.outputMint !== q.outputMint || data.inAmount !== q.amount) {
      throw new Error("Quote does not match requested trade");
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
