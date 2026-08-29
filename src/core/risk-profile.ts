export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type RiskProfileConfig = {
  minLiquidityUsd: number;
  minVolume24hUsd: number;
  minAgeHours: number;
  allowVeryNew: boolean;
};

const CONFIG: Record<RiskProfile, RiskProfileConfig> = {
  conservative: { minLiquidityUsd: 50_000, minVolume24hUsd: 100_000, minAgeHours: 24, allowVeryNew: false },
  balanced: { minLiquidityUsd: 25_000, minVolume24hUsd: 50_000, minAgeHours: 6, allowVeryNew: false },
  aggressive: { minLiquidityUsd: 10_000, minVolume24hUsd: 10_000, minAgeHours: 0, allowVeryNew: true },
};

export function getRiskProfileConfig(profile: RiskProfile): RiskProfileConfig {
  return CONFIG[profile];
}

export function parseRiskProfile(value: string | undefined): RiskProfile {
  return value === "conservative" || value === "aggressive" ? value : "balanced";
}
