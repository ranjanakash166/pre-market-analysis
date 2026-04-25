import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getLatestSubscriptionByUser, listPaymentsByUser } from "@/lib/billing-db";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [subscription, payments] = await Promise.all([
      getLatestSubscriptionByUser(userId),
      listPaymentsByUser(userId),
    ]);
    return NextResponse.json({ subscription, payments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load billing profile" },
      { status: 500 },
    );
  }
}
