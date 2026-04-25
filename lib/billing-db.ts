import postgres from "postgres";
import { getSql } from "@/lib/db";
import { toJsonValue } from "@/lib/auth-db";

type Sql = NonNullable<ReturnType<typeof getSql>>;

export type BillingPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tierRank: number;
  amountPaise: number;
  currency: string;
  billingType: "recurring" | "one_time";
  intervalUnit: "day" | "week" | "month" | "year" | null;
  intervalCount: number | null;
  active: boolean;
};

type BillingPlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier_rank: number;
  amount_paise: number;
  currency: string;
  billing_type: "recurring" | "one_time";
  interval_unit: "day" | "week" | "month" | "year" | null;
  interval_count: number | null;
  active: boolean;
};

function requireSql(): Sql {
  const sql = getSql();
  if (!sql) {
    throw new Error("Database is required for billing");
  }
  return sql;
}

function mapPlan(r: BillingPlanRow): BillingPlan {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    tierRank: r.tier_rank,
    amountPaise: r.amount_paise,
    currency: r.currency,
    billingType: r.billing_type,
    intervalUnit: r.interval_unit,
    intervalCount: r.interval_count,
    active: r.active,
  };
}

export async function ensureDefaultBillingPlans(): Promise<void> {
  const sql = requireSql();
  const defaults = [
    {
      code: "basic_monthly",
      name: "Basic Monthly",
      description: "Starter plan billed monthly.",
      tierRank: 1,
      amountPaise: 29900,
      currency: "INR",
      billingType: "recurring",
      intervalUnit: "month",
      intervalCount: 1,
      metadata: { tier: "basic" },
    },
    {
      code: "pro_yearly",
      name: "Pro Yearly",
      description: "Pro plan billed yearly.",
      tierRank: 2,
      amountPaise: 299900,
      currency: "INR",
      billingType: "recurring",
      intervalUnit: "year",
      intervalCount: 1,
      metadata: { tier: "pro" },
    },
    {
      code: "team_lifetime",
      name: "Team One-Time",
      description: "One-time Team access purchase.",
      tierRank: 3,
      amountPaise: 499900,
      currency: "INR",
      billingType: "one_time",
      intervalUnit: null,
      intervalCount: null,
      metadata: { tier: "team" },
    },
  ] as const;

  for (const p of defaults) {
    await sql`
      INSERT INTO billing_plans
      (code, name, description, tier_rank, amount_paise, currency, billing_type, interval_unit, interval_count, metadata, active)
      VALUES
      (${p.code}, ${p.name}, ${p.description}, ${p.tierRank}, ${p.amountPaise}, ${p.currency}, ${p.billingType}, ${p.intervalUnit}, ${p.intervalCount}, ${sql.json(toJsonValue(p.metadata))}, true)
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        tier_rank = EXCLUDED.tier_rank,
        amount_paise = EXCLUDED.amount_paise,
        currency = EXCLUDED.currency,
        billing_type = EXCLUDED.billing_type,
        interval_unit = EXCLUDED.interval_unit,
        interval_count = EXCLUDED.interval_count,
        metadata = EXCLUDED.metadata,
        updated_at = now()
    `;
  }
}

export async function listActivePlans(): Promise<BillingPlan[]> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT id, code, name, description, tier_rank, amount_paise, currency, billing_type, interval_unit, interval_count, active
    FROM billing_plans
    WHERE active = true
    ORDER BY tier_rank ASC, amount_paise ASC
  `) as BillingPlanRow[];
  return rows.map(mapPlan);
}

export async function getPlanByCode(code: string): Promise<BillingPlan | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT id, code, name, description, tier_rank, amount_paise, currency, billing_type, interval_unit, interval_count, active
    FROM billing_plans
    WHERE code = ${code}
    LIMIT 1
  `) as BillingPlanRow[];
  return rows[0] ? mapPlan(rows[0]) : null;
}

export async function createPayment(input: {
  userId: string;
  planId: string;
  amountPaise: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "refunded";
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  subscriptionId?: string | null;
  metadata?: unknown;
}): Promise<void> {
  const sql = requireSql();
  await sql`
    INSERT INTO payments (
      user_id, plan_id, subscription_id, provider, provider_order_id, provider_payment_id,
      amount_paise, currency, status, metadata
    ) VALUES (
      ${input.userId},
      ${input.planId},
      ${input.subscriptionId ?? null},
      'razorpay',
      ${input.providerOrderId ?? null},
      ${input.providerPaymentId ?? null},
      ${input.amountPaise},
      ${input.currency},
      ${input.status},
      ${sql.json(toJsonValue(input.metadata ?? {}))}
    )
    ON CONFLICT (provider, provider_order_id)
    DO UPDATE SET
      provider_payment_id = COALESCE(EXCLUDED.provider_payment_id, payments.provider_payment_id),
      status = EXCLUDED.status,
      metadata = EXCLUDED.metadata,
      updated_at = now()
  `;
}

export async function upsertSubscription(input: {
  userId: string;
  planId: string;
  providerSubscriptionId: string;
  status: "created" | "trialing" | "active" | "past_due" | "cancelled" | "expired";
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  metadata?: unknown;
}): Promise<string> {
  const sql = requireSql();
  const rows = (await sql`
    INSERT INTO subscriptions (
      user_id, plan_id, provider, provider_subscription_id, status,
      current_period_start, current_period_end, cancel_at_period_end, metadata
    ) VALUES (
      ${input.userId},
      ${input.planId},
      'razorpay',
      ${input.providerSubscriptionId},
      ${input.status},
      ${input.currentPeriodStart ?? null},
      ${input.currentPeriodEnd ?? null},
      ${input.cancelAtPeriodEnd ?? false},
      ${sql.json(toJsonValue(input.metadata ?? {}))}
    )
    ON CONFLICT (provider_subscription_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      metadata = EXCLUDED.metadata,
      updated_at = now()
    RETURNING id
  `) as { id: string }[];

  return rows[0].id;
}

export async function markBillingEventProcessed(input: {
  eventId: string;
  eventType: string;
  payload: unknown;
}): Promise<boolean> {
  const sql = requireSql();
  const rows = (await sql`
    INSERT INTO billing_events (provider, event_id, event_type, payload)
    VALUES ('razorpay', ${input.eventId}, ${input.eventType}, ${sql.json(toJsonValue(input.payload))})
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function getLatestSubscriptionByUser(userId: string): Promise<{
  id: string;
  status: string;
  planCode: string;
  currentPeriodEnd: string | null;
} | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT s.id, s.status, p.code AS plan_code, s.current_period_end
    FROM subscriptions s
    JOIN billing_plans p ON p.id = s.plan_id
    WHERE s.user_id = ${userId}
    ORDER BY s.updated_at DESC
    LIMIT 1
  `) as { id: string; status: string; plan_code: string; current_period_end: Date | null }[];
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    planCode: row.plan_code,
    currentPeriodEnd: row.current_period_end?.toISOString() ?? null,
  };
}

export async function listPaymentsByUser(userId: string): Promise<
  {
    id: string;
    amountPaise: number;
    currency: string;
    status: string;
    createdAt: string;
    planCode: string | null;
    providerPaymentId: string | null;
  }[]
> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT py.id, py.amount_paise, py.currency, py.status, py.created_at,
           py.provider_payment_id, bp.code AS plan_code
    FROM payments py
    LEFT JOIN billing_plans bp ON bp.id = py.plan_id
    WHERE py.user_id = ${userId}
    ORDER BY py.created_at DESC
    LIMIT 50
  `) as {
    id: string;
    amount_paise: number;
    currency: string;
    status: string;
    created_at: Date;
    provider_payment_id: string | null;
    plan_code: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    amountPaise: r.amount_paise,
    currency: r.currency,
    status: r.status,
    createdAt: r.created_at.toISOString(),
    planCode: r.plan_code,
    providerPaymentId: r.provider_payment_id,
  }));
}

export async function getPaymentByOrderId(orderId: string): Promise<{
  id: string;
  userId: string;
  planId: string | null;
  status: string;
} | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT id, user_id, plan_id, status
    FROM payments
    WHERE provider = 'razorpay' AND provider_order_id = ${orderId}
    LIMIT 1
  `) as { id: string; user_id: string; plan_id: string | null; status: string }[];
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
  };
}

export async function updatePaymentByOrderId(input: {
  orderId: string;
  paymentId: string;
  status: "authorized" | "captured" | "failed" | "refunded";
  metadata?: unknown;
}): Promise<void> {
  const sql = requireSql();
  await sql`
    UPDATE payments
    SET provider_payment_id = ${input.paymentId},
        status = ${input.status},
        metadata = ${sql.json(toJsonValue(input.metadata ?? {}))},
        updated_at = now()
    WHERE provider = 'razorpay' AND provider_order_id = ${input.orderId}
  `;
}

export async function getPlanById(planId: string): Promise<BillingPlan | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT id, code, name, description, tier_rank, amount_paise, currency, billing_type, interval_unit, interval_count, active
    FROM billing_plans
    WHERE id = ${planId}
    LIMIT 1
  `) as BillingPlanRow[];
  return rows[0] ? mapPlan(rows[0]) : null;
}

export async function getPlanByProviderSubscriptionId(providerSubscriptionId: string): Promise<{
  userId: string;
  planId: string;
} | null> {
  const sql = requireSql();
  const rows = (await sql`
    SELECT user_id, plan_id
    FROM subscriptions
    WHERE provider_subscription_id = ${providerSubscriptionId}
    LIMIT 1
  `) as { user_id: string; plan_id: string }[];
  const row = rows[0];
  if (!row) return null;
  return { userId: row.user_id, planId: row.plan_id };
}

export function toRazorpayUnixSeconds(date: Date | null | undefined): number | undefined {
  if (!date) return undefined;
  return Math.floor(date.getTime() / 1000);
}

export function fromRazorpayUnixSeconds(sec: number | null | undefined): Date | null {
  if (!sec) return null;
  return new Date(sec * 1000);
}

export function jsonToValue(input: unknown): postgres.JSONValue {
  return toJsonValue(input);
}
