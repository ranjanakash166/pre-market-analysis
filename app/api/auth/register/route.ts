import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authDbAvailable, createUserWithPassword, getUserByEmail } from "@/lib/auth-db";
import { hashPassword } from "@/lib/auth-password";
import { issueAndSendVerificationEmail } from "@/lib/auth-verification";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
});

export async function POST(request: NextRequest) {
  try {
    if (!authDbAvailable()) {
      return NextResponse.json(
        { error: "Authentication DB is not configured. Set DATABASE_URL or POSTGRES_URL." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
    }

    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await createUserWithPassword({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
    });

    await issueAndSendVerificationEmail({
      userId: user.id,
      email: user.email,
      userName: user.name,
    });

    return NextResponse.json(
      {
        ok: true,
        verificationRequired: true,
        message: "Account created. Check your inbox to verify your email.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 },
    );
  }
}
