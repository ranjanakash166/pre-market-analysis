import { getSql } from "@/lib/db";

type Sql = NonNullable<ReturnType<typeof getSql>>;

type NumericLike = number | string;

type RiskProfileRow = {
  user_id: string;
  capital: NumericLike;
  default_risk_percent: NumericLike;
  default_concurrent_positions: number;
  created_at: Date;
  updated_at: Date;
};

export type UserRiskProfile = {
  userId: string;
  capital: number;
  defaultRiskPercent: number;
  defaultConcurrentPositions: number;
  createdAt: string;
  updatedAt: string;
};

function requireSql(): Sql {
  const sql = getSql();
  if (!sql) {
    throw new Error("Database is required for risk profiles");
  }
  return sql;
}

function toNumber(value: NumericLike): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toProfile(row: RiskProfileRow): UserRiskProfile {
  return {
    userId: row.user_id,
    capital: toNumber(row.capital),
    defaultRiskPercent: toNumber(row.default_risk_percent),
    defaultConcurrentPositions: row.default_concurrent_positions,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getRiskProfile(userId: string): Promise<UserRiskProfile | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT user_id, capital, default_risk_percent, default_concurrent_positions, created_at, updated_at
    FROM user_risk_profiles
    WHERE user_id = ${userId}
    LIMIT 1
  `) as RiskProfileRow[];
  return rows[0] ? toProfile(rows[0]) : null;
}

export type RiskProfileUpsertInput = {
  capital: number;
  defaultRiskPercent: number;
  defaultConcurrentPositions: number;
};

export async function upsertRiskProfile(
  userId: string,
  input: RiskProfileUpsertInput,
): Promise<UserRiskProfile> {
  const sql = requireSql();
  const rows = (await sql`
    INSERT INTO user_risk_profiles (
      user_id, capital, default_risk_percent, default_concurrent_positions
    ) VALUES (
      ${userId}, ${input.capital}, ${input.defaultRiskPercent}, ${input.defaultConcurrentPositions}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      capital = EXCLUDED.capital,
      default_risk_percent = EXCLUDED.default_risk_percent,
      default_concurrent_positions = EXCLUDED.default_concurrent_positions,
      updated_at = now()
    RETURNING user_id, capital, default_risk_percent, default_concurrent_positions, created_at, updated_at
  `) as RiskProfileRow[];
  return toProfile(rows[0]);
}
