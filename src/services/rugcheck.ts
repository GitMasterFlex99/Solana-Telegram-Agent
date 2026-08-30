export type RugCheckRisk = {
  name?: string;
  level?: string;
  description?: string;
};

export type RugCheckSummary = {
  score?: number;
  riskLevel?: string;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  lpLocked?: boolean;
  lpLockedPct?: number;
  topHoldersPct?: number;
  risks?: RugCheckRisk[];
};

const RUGCHECK_URL = "https://api.rugcheck.xyz/v1/tokens";

export async function fetchRugCheckSummary(
  address: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RugCheckSummary | null> {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7_500);
  try {
    const response = await fetchImpl(`${RUGCHECK_URL}/${encodeURIComponent(address)}/report/summary`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json() as unknown;
    if (!data || typeof data !== "object") return null;
    const value = data as Record<string, unknown>;
    return {
      score: typeof value.score === "number" ? value.score : undefined,
      riskLevel: typeof value.riskLevel === "string" ? value.riskLevel : undefined,
      mintAuthority: typeof value.mintAuthority === "string" || value.mintAuthority === null ? value.mintAuthority : undefined,
      freezeAuthority: typeof value.freezeAuthority === "string" || value.freezeAuthority === null ? value.freezeAuthority : undefined,
      lpLocked: typeof value.lpLocked === "boolean" ? value.lpLocked : undefined,
      lpLockedPct: typeof value.lpLockedPct === "number" ? value.lpLockedPct : undefined,
      topHoldersPct: typeof value.topHoldersPct === "number" ? value.topHoldersPct : undefined,
      risks: Array.isArray(value.risks)
        ? value.risks.filter((risk): risk is RugCheckRisk => typeof risk === "object" && risk !== null)
        : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function rugCheckRiskFlags(summary?: RugCheckSummary): string[] {
  if (!summary) return [];
  const flags: string[] = [];
  const level = summary.riskLevel?.toLowerCase();
  if (level === "danger") flags.push("RugCheck danger");
  else if (level === "warning") flags.push("RugCheck warning");
  if (summary.mintAuthority) flags.push("mint authority active");
  if (summary.freezeAuthority) flags.push("freeze authority active");
  if (summary.lpLocked === false || (summary.lpLockedPct !== undefined && summary.lpLockedPct < 50)) flags.push("liquidity not sufficiently locked");
  if (summary.topHoldersPct !== undefined && summary.topHoldersPct > 35) flags.push("high holder concentration");
  for (const risk of summary.risks ?? []) {
    const level = risk.level?.toLowerCase();
    if (level === "danger" || level === "high") {
      const name = risk.name?.trim();
      if (name && !flags.includes(name)) flags.push(name);
    }
  }
  return flags.slice(0, 5);
}

export function rugCheckPenalty(summary?: RugCheckSummary): number {
  if (!summary) return 0;
  const level = summary.riskLevel?.toLowerCase();
  if (level === "danger") return 30;
  if (level === "warning") return 12;
  return 0;
}
