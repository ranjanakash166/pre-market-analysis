import { createHmac } from "node:crypto";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function getRazorpayCreds() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
  }
  return { keyId, keySecret };
}

function authHeader(): string {
  const { keyId, keySecret } = getRazorpayCreds();
  const basic = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${basic}`;
}

async function razorpayPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${RAZORPAY_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
};

export type RazorpaySubscription = {
  id: string;
  status: string;
  current_start?: number;
  current_end?: number;
};

export async function createRazorpayOrder(input: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  return razorpayPost<RazorpayOrder>("/orders", {
    amount: input.amountPaise,
    currency: input.currency,
    receipt: input.receipt,
    notes: input.notes ?? {},
  });
}

export async function createRazorpayPlan(input: {
  period: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  itemName: string;
  amountPaise: number;
  currency: string;
  description?: string;
}): Promise<{ id: string }> {
  return razorpayPost<{ id: string }>("/plans", {
    period: input.period,
    interval: input.interval,
    item: {
      name: input.itemName,
      amount: input.amountPaise,
      currency: input.currency,
      description: input.description ?? input.itemName,
    },
  });
}

export async function createRazorpaySubscription(input: {
  planId: string;
  totalCount?: number;
  quantity?: number;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscription> {
  return razorpayPost<RazorpaySubscription>("/subscriptions", {
    plan_id: input.planId,
    total_count: input.totalCount ?? 120,
    quantity: input.quantity ?? 1,
    customer_notify: 1,
    notes: input.notes ?? {},
  });
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) throw new Error("Missing RAZORPAY_KEY_SECRET");
  const body = `${input.orderId}|${input.paymentId}`;
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return digest === input.signature;
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return digest === signature;
}

export function mapIntervalToRazorpayPeriod(unit: "day" | "week" | "month" | "year"): "daily" | "weekly" | "monthly" | "yearly" {
  if (unit === "day") return "daily";
  if (unit === "week") return "weekly";
  if (unit === "month") return "monthly";
  return "yearly";
}

export function getRazorpayKeyId(): string {
  return getRazorpayCreds().keyId;
}
