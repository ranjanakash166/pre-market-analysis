import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

let globalSql: Sql | null | undefined;

function firstNonEmptyEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return undefined;
}

/**
 * Shared `postgres` client, or `null` when no Postgres URL env is set.
 * Supports Vercel + Neon integrations (including custom `STORAGE_*` prefixes on connect).
 */
export function getSql(): Sql | null {
  const url = firstNonEmptyEnv([
    "POSTGRES_URL",
    "DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "STORAGE_DATABASE_URL",
    "STORAGE_POSTGRES_URL",
  ]);
  if (!url) {
    return null;
  }
  if (globalSql === undefined) {
    globalSql = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 12 });
  }
  return globalSql;
}
