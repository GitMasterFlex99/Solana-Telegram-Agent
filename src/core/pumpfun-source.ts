import { normalizePumpfunCoin, type PumpfunCoin } from "./pumpfun.js";

export type PumpfunSource = {
  endpoint: string;
  fetchImpl?: typeof fetch;
};

export async function discoverPumpfun(source: PumpfunSource): Promise<PumpfunCoin[]> {
  const fetchImpl = source.fetchImpl ?? fetch;
  const response = await fetchImpl(source.endpoint, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Pump.fun discovery returned ${response.status}`);
  const body = await response.json() as unknown;
  const rows = Array.isArray(body)
    ? body
    : typeof body === "object" && body !== null && Array.isArray((body as { coins?: unknown[] }).coins)
      ? (body as { coins: unknown[] }).coins
      : [];
  return rows
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map(normalizePumpfunCoin)
    .filter((coin): coin is PumpfunCoin => coin !== null);
}
