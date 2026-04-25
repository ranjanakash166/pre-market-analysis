import { NextRequest, NextResponse } from "next/server";
import {
  createPayment,
  fromRazorpayUnixSeconds,
  getPlanByProviderSubscriptionId,
  markBillingEventProcessed,
  upsertSubscription,
} from "@/lib/billing-db";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

type RazorpayEvent = {
  event: string;
  created_at?: number;
  payload?: {
    payment?: { entity?: Record<string, unknown> };
    subscription?: { entity?: Record<string, unknown> };
  };
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapSubscriptionStatus(status: string | null): "created" | "trialing" | "active" | "past_due" | "cancelled" | "expired" {
  if (!status) return "created";
  if (status === "active") return "active";
  if (status === "authenticated" || status === "pending") return "trialing";
  if (status === "halted" || status === "paused") return "past_due";
  if (status === "cancelled") return "cancelled";
  if (status === "completed" || status === "expired") return "expired";
  return "created";
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    const rawBody = await request.text();
    const valid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!valid) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });

    const event = JSON.parse(rawBody) as RazorpayEvent;
    const eventId = `${event.event}:${event.created_at ?? Date.now()}`;
    const accepted = await markBillingEventProcessed({
      eventId,
      eventType: event.event,
      payload: event,
    });
    if (!accepted) return NextResponse.json({ ok: true, duplicate: true });

    const subEntity = event.payload?.subscription?.entity ?? {};
    const paymentEntity = event.payload?.payment?.entity ?? {};

    const providerSubscriptionId = asString(subEntity.id);
    if (providerSubscriptionId) {
      const mapping = await getPlanByProviderSubscriptionId(providerSubscriptionId);
      if (mapping) {
        await upsertSubscription({
          userId: mapping.userId,
          planId: mapping.planId,
          providerSubscriptionId,
          status: mapSubscriptionStatus(asString(subEntity.status)),
          currentPeriodStart: fromRazorpayUnixSeconds(asNumber(subEntity.current_start)),
          currentPeriodEnd: fromRazorpayUnixSeconds(asNumber(subEntity.current_end)),
          cancelAtPeriodEnd: asNumber(subEntity.remaining_count) === 0,
          metadata: subEntity,
        });
      }
    }

    const orderId = asString(paymentEntity.order_id);
    const paymentId = asString(paymentEntity.id);
    const amount = asNumber(paymentEntity.amount);
    const currency = asString(paymentEntity.currency) ?? "INR";
    if (orderId && paymentId && amount != null) {
      const mapping = providerSubscriptionId
        ? await getPlanByProviderSubscriptionId(providerSubscriptionId)
        : null;
      if (mapping) {
        await createPayment({
          userId: mapping.userId,
          planId: mapping.planId,
          amountPaise: amount,
          currency,
          status: event.event.includes("failed") ? "failed" : "captured",
          providerOrderId: orderId,
          providerPaymentId: paymentId,
          metadata: paymentEntity,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}
