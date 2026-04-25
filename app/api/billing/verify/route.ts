import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getPaymentByOrderId,
  getPlanById,
  updatePaymentByOrderId,
  upsertSubscription,
} from "@/lib/billing-db";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    }

    const payment = await getPaymentByOrderId(parsed.data.razorpay_order_id);
    if (!payment || payment.userId !== userId || !payment.planId) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
    });
    if (!valid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });

    await updatePaymentByOrderId({
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      status: "captured",
      metadata: parsed.data,
    });

    const plan = await getPlanById(payment.planId);
    if (plan?.billingType === "one_time") {
      await upsertSubscription({
        userId,
        planId: plan.id,
        providerSubscriptionId: `manual_one_time_${parsed.data.razorpay_payment_id}`,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date("2099-12-31T23:59:59.000Z"),
        metadata: {
          oneTime: true,
          providerOrderId: parsed.data.razorpay_order_id,
          providerPaymentId: parsed.data.razorpay_payment_id,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 },
    );
  }
}
