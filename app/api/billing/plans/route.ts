import { NextResponse } from "next/server";
import { ensureDefaultBillingPlans, listActivePlans } from "@/lib/billing-db";

export async function GET() {
  try {
    await ensureDefaultBillingPlans();
    const plans = await listActivePlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load plans" },
      { status: 500 },
    );
  }
}
