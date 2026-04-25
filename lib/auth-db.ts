import postgres from "postgres";
import { getSql } from "@/lib/db";

type Sql = NonNullable<ReturnType<typeof getSql>>;

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerifiedAt: string | null;
};

type AppUserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  email_verified_at: Date | null;
};

type CredentialsRow = {
  user_id: string;
  password_hash: string;
};

function requireSql(): Sql {
  const sql = getSql();
  if (!sql) {
    throw new Error("Database is required for authentication");
  }
  return sql;
}

function toAppUser(row: AppUserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    emailVerifiedAt: row.email_verified_at?.toISOString() ?? null,
  };
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT id, email, name, image, email_verified_at
    FROM app_users
    WHERE email = ${email.toLowerCase()}
    LIMIT 1
  `) as AppUserRow[];
  const row = rows[0];
  return row ? toAppUser(row) : null;
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT id, email, name, image, email_verified_at
    FROM app_users
    WHERE id = ${userId}
    LIMIT 1
  `) as AppUserRow[];
  const row = rows[0];
  return row ? toAppUser(row) : null;
}

export async function createUserWithPassword(input: {
  email: string;
  name?: string | null;
  passwordHash: string;
}): Promise<AppUser> {
  const sql = requireSql();
  const email = input.email.toLowerCase().trim();
  const tx = await sql.begin(async (txn) => {
    const inserted = (await txn`
      INSERT INTO app_users (email, name, email_verified_at)
      VALUES (${email}, ${input.name ?? null}, now())
      RETURNING id, email, name, image, email_verified_at
    `) as AppUserRow[];
    const user = inserted[0];
    await txn`
      INSERT INTO user_credentials (user_id, password_hash)
      VALUES (${user.id}, ${input.passwordHash})
    `;
    await txn`
      INSERT INTO auth_accounts (user_id, provider, provider_account_id, type)
      VALUES (${user.id}, 'credentials', ${user.id}, 'credentials')
      ON CONFLICT (provider, provider_account_id) DO NOTHING
    `;
    return user;
  });
  return toAppUser(tx);
}

export async function getCredentialsByEmail(email: string): Promise<{
  user: AppUser;
  passwordHash: string;
} | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT u.id, u.email, u.name, u.image, u.email_verified_at, c.user_id, c.password_hash
    FROM app_users u
    JOIN user_credentials c ON c.user_id = u.id
    WHERE u.email = ${email.toLowerCase()}
    LIMIT 1
  `) as (AppUserRow & CredentialsRow)[];
  const row = rows[0];
  if (!row) return null;
  return { user: toAppUser(row), passwordHash: row.password_hash };
}

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  providerAccountId: string;
}): Promise<AppUser> {
  const sql = requireSql();
  const email = input.email.toLowerCase().trim();
  const user = await sql.begin(async (txn) => {
    const existing = (await txn`
      SELECT id, email, name, image, email_verified_at
      FROM app_users
      WHERE email = ${email}
      LIMIT 1
    `) as AppUserRow[];

    let row = existing[0];
    if (!row) {
      const inserted = (await txn`
        INSERT INTO app_users (email, name, image, email_verified_at)
        VALUES (${email}, ${input.name ?? null}, ${input.image ?? null}, now())
        RETURNING id, email, name, image, email_verified_at
      `) as AppUserRow[];
      row = inserted[0];
    } else {
      const updated = (await txn`
        UPDATE app_users
        SET name = COALESCE(${input.name ?? null}, name),
            image = COALESCE(${input.image ?? null}, image),
            email_verified_at = COALESCE(email_verified_at, now()),
            updated_at = now()
        WHERE id = ${row.id}
        RETURNING id, email, name, image, email_verified_at
      `) as AppUserRow[];
      row = updated[0];
    }

    await txn`
      INSERT INTO auth_accounts (user_id, provider, provider_account_id, type)
      VALUES (${row.id}, 'google', ${input.providerAccountId}, 'oauth')
      ON CONFLICT (provider, provider_account_id)
      DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = now()
    `;
    return row;
  });

  return toAppUser(user);
}

export async function getActiveSubscriptionSnapshot(userId: string): Promise<{
  hasAccess: boolean;
  planCode: string | null;
  status: string | null;
  periodEnd: string | null;
}> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT s.status, s.current_period_end, p.code AS plan_code
    FROM subscriptions s
    JOIN billing_plans p ON p.id = s.plan_id
    WHERE s.user_id = ${userId}
    ORDER BY s.updated_at DESC
    LIMIT 1
  `) as { status: string; current_period_end: Date | null; plan_code: string }[];

  const row = rows[0];
  if (!row) {
    return { hasAccess: false, planCode: null, status: null, periodEnd: null };
  }

  const now = Date.now();
  const validStatus = row.status === "active" || row.status === "trialing";
  const periodOk = !row.current_period_end || row.current_period_end.getTime() > now;
  return {
    hasAccess: validStatus && periodOk,
    planCode: row.plan_code,
    status: row.status,
    periodEnd: row.current_period_end?.toISOString() ?? null,
  };
}

export function authDbAvailable(): boolean {
  return getSql() != null;
}

export function toJsonValue(value: unknown): postgres.JSONValue {
  return JSON.parse(JSON.stringify(value)) as postgres.JSONValue;
}
