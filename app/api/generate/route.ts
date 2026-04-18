import { NextRequest, NextResponse } from "next/server";
import { generateReport } from "@/lib/ai";
import { traderModeSchema } from "@/lib/schema";
import { saveReport } from "@/lib/store";

/** Vercel / hosted: raise if your plan allows (Pro max 300s). Long reports need headroom vs default 60s. */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { mode?: string };
    const mode = traderModeSchema.safeParse(body.mode ?? "A");
    if (!mode.success) {
      return NextResponse.json({ error: "Invalid mode. Expected A/B/C." }, { status: 400 });
    }

    const report = await generateReport(mode.data);
    const stored = await saveReport(report);
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
