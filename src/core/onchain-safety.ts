export type OnchainSafety = {
  mint: string;
  tokenProgram: "spl-token" | "token-2022" | "unknown";
  mintAuthorityActive: boolean | null;
  freezeAuthorityActive: boolean | null;
  supply: number | null;
  topHolderPercent: number | null;
  top5HolderPercent: number | null;
  flags: string[];
};

type RpcResponse<T> = { result?: T; error?: { message?: string } };
type AccountInfo = { value?: { owner?: string; data?: { parsed?: { info?: { mintAuthority?: string | null; freezeAuthority?: string | null; supply?: string; decimals?: number } } } } | null };
type LargestAccounts = { value?: Array<{ amount?: string; decimals?: number }> };

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

async function rpc<T>(rpcUrl: string, method: string, params: unknown[], timeoutMs = 6_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: controller.signal });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const body = await response.json() as RpcResponse<T>;
    if (body.error) throw new Error(body.error.message ?? "RPC request failed");
    if (body.result === undefined) throw new Error("RPC response missing result");
    return body.result;
  } finally { clearTimeout(timeout); }
}

export async function inspectToken(rpcUrl: string, mint: string): Promise<OnchainSafety> {
  const account = await rpc<AccountInfo>(rpcUrl, "getAccountInfo", [mint, { encoding: "jsonParsed", commitment: "confirmed" }]);
  const value = account.value;
  if (!value) throw new Error("Mint account not found");
  const parsed = value.data?.parsed?.info;
  const tokenProgram = value.owner === TOKEN_PROGRAM ? "spl-token" : value.owner === TOKEN_2022_PROGRAM ? "token-2022" : "unknown";
  const supplyRaw = parsed?.supply;
  const decimals = parsed?.decimals ?? 0;
  const supply = supplyRaw ? Number(supplyRaw) / 10 ** decimals : null;
  const largest = await rpc<LargestAccounts>(rpcUrl, "getTokenLargestAccounts", [mint, { commitment: "confirmed" }]);
  const amounts = (largest.value ?? []).map((a) => Number(a.amount ?? 0) / 10 ** (a.decimals ?? decimals)).filter(Number.isFinite);
  const topHolderPercent = supply && supply > 0 && amounts[0] !== undefined ? (amounts[0] / supply) * 100 : null;
  const top5HolderPercent = supply && supply > 0 ? (amounts.slice(0, 5).reduce((sum, amount) => sum + amount, 0) / supply) * 100 : null;
  const flags: string[] = [];
  if (parsed?.mintAuthority) flags.push("Mint authority is still active");
  if (parsed?.freezeAuthority) flags.push("Freeze authority is still active");
  if (topHolderPercent !== null && topHolderPercent >= 20) flags.push("Top token account holds 20%+ of supply");
  else if (topHolderPercent !== null && topHolderPercent >= 10) flags.push("Top token account holds 10%+ of supply");
  if (top5HolderPercent !== null && top5HolderPercent >= 50) flags.push("Top 5 token accounts hold 50%+ of supply");
  if (tokenProgram === "token-2022") flags.push("Token uses Token-2022; extensions require additional review");
  if (tokenProgram === "unknown") flags.push("Token program could not be verified");
  return { mint, tokenProgram, mintAuthorityActive: parsed?.mintAuthority ? true : parsed ? false : null, freezeAuthorityActive: parsed?.freezeAuthority ? true : parsed ? false : null, supply, topHolderPercent, top5HolderPercent, flags };
}
