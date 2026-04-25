import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateReport } from "@/lib/ai";
import { FREE_TIER_ALLOWED_GENERATE_MODES, hasPaidAccessForUser } from "@/lib/feature-gates";
import { traderModeSchema } from "@/lib/schema";
import { saveReport } from "@/lib/store";

/** Vercel / hosted: raise if your plan allows (Pro max 300s). Long reports need headroom vs default 60s. */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const body = (await request.json()) as { mode?: string };
    const mode = traderModeSchema.safeParse(body.mode ?? "A");
    if (!mode.success) {
      return NextResponse.json({ error: "Invalid mode. Expected A/B/C." }, { status: 400 });
    }

    const isPaid = await hasPaidAccessForUser(session.user.id);
    if (!isPaid && !FREE_TIER_ALLOWED_GENERATE_MODES.has(mode.data)) {
      return NextResponse.json(
        {
          error:
            "Free tier currently supports Generate for A mode only. Upgrade to access B/C generation.",
          upgradePath: "/subscribe",
        },
        { status: 402 },
      );
    }

    const report = await generateReport(mode.data);
    const stored = await saveReport(report);
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
