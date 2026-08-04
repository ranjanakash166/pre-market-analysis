import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getRiskProfile, upsertRiskProfile } from "@/lib/risk-profile-db";

const riskProfileUpsertSchema = z.object({
  capital: z.coerce.number().finite().positive(),
  defaultRiskPercent: z.coerce.number().finite().positive().max(100),
  defaultConcurrentPositions: z.coerce.number().int().min(1).max(50),
});

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const profile = await getRiskProfile(userId);
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load risk profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = riskProfileUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid risk profile payload." },
        { status: 400 },
      );
    }

    const profile = await upsertRiskProfile(userId, parsed.data);
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save risk profile" },
      { status: 500 },
    );
  }
}
