import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resendVerificationEmailForAddress, verificationDbReady } from "@/lib/auth-verification";

const resendSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  if (!verificationDbReady()) {
    return NextResponse.json(
      { error: "Authentication DB is not configured. Set DATABASE_URL or POSTGRES_URL." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  try {
    const out = await resendVerificationEmailForAddress(parsed.data.email);
    if (typeof out.cooldownSeconds === "number" && out.cooldownSeconds > 0) {
      return NextResponse.json(
        { error: `Please wait ${out.cooldownSeconds}s before resending.`, cooldownSeconds: out.cooldownSeconds },
        { status: 429 },
      );
    }
    return NextResponse.json({ ok: true, message: "If this account exists, verification email has been sent." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend verification email." },
      { status: 400 },
    );
  }
}

