import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  createPayment,
  getPlanByCode,
  setPlanMetadata,
  toRazorpayUnixSeconds,
  upsertSubscription,
} from "@/lib/billing-db";
import {
  createRazorpayOrder,
  createRazorpayPlan,
  createRazorpaySubscription,
  getRazorpayKeyId,
  mapIntervalToRazorpayPeriod,
} from "@/lib/razorpay";

const inputSchema = z.object({
  planCode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const plan = await getPlanByCode(parsed.data.planCode);
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 404 });
    }

    if (plan.billingType === "one_time") {
      const order = await createRazorpayOrder({
        amountPaise: plan.amountPaise,
        currency: plan.currency,
        receipt: `plan_${plan.code}_${Date.now()}`,
        notes: { planCode: plan.code, userId },
      });
      await createPayment({
        userId,
        planId: plan.id,
        amountPaise: plan.amountPaise,
        currency: plan.currency,
        status: "created",
        providerOrderId: order.id,
        metadata: { planCode: plan.code },
      });
      return NextResponse.json({
        mode: "one_time",
        razorpayKeyId: getRazorpayKeyId(),
        razorpayOrderId: order.id,
        amountPaise: plan.amountPaise,
        currency: plan.currency,
      });
    }

    if (!plan.intervalUnit || !plan.intervalCount) {
      return NextResponse.json({ error: "Recurring plan interval not configured" }, { status: 400 });
    }

    const existingPlanId =
      typeof plan.metadata?.razorpayPlanId === "string" ? plan.metadata.razorpayPlanId : null;
    const rpPlanId =
      existingPlanId ??
      (
        await createRazorpayPlan({
          period: mapIntervalToRazorpayPeriod(plan.intervalUnit),
          interval: plan.intervalCount,
          itemName: plan.name,
          amountPaise: plan.amountPaise,
          currency: plan.currency,
          description: plan.description ?? undefined,
        })
      ).id;

    if (!existingPlanId) {
      await setPlanMetadata(plan.id, { ...plan.metadata, razorpayPlanId: rpPlanId });
    }

    const rpSub = await createRazorpaySubscription({
      planId: rpPlanId,
      notes: { planCode: plan.code, userId },
    });

    const subId = await upsertSubscription({
      userId,
      planId: plan.id,
      providerSubscriptionId: rpSub.id,
      status: rpSub.status === "active" ? "active" : "created",
      currentPeriodStart: rpSub.current_start ? new Date(rpSub.current_start * 1000) : null,
      currentPeriodEnd: rpSub.current_end ? new Date(rpSub.current_end * 1000) : null,
      metadata: { razorpayPlanId: rpPlanId, planCode: plan.code },
    });

    await createPayment({
      userId,
      planId: plan.id,
      subscriptionId: subId,
      amountPaise: plan.amountPaise,
      currency: plan.currency,
      status: "created",
      metadata: {
        mode: "recurring",
        providerSubscriptionId: rpSub.id,
        currentStart: toRazorpayUnixSeconds(rpSub.current_start ? new Date(rpSub.current_start * 1000) : null),
        currentEnd: toRazorpayUnixSeconds(rpSub.current_end ? new Date(rpSub.current_end * 1000) : null),
      },
    });

    return NextResponse.json({
      mode: "recurring",
      razorpayKeyId: getRazorpayKeyId(),
      razorpaySubscriptionId: rpSub.id,
      amountPaise: plan.amountPaise,
      currency: plan.currency,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout creation failed" },
      { status: 500 },
    );
  }
}
