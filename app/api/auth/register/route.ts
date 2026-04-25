import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserWithPassword, getUserByEmail } from "@/lib/auth-db";
import { hashPassword } from "@/lib/auth-password";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
});

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        ok: true,
        user: { id: user.id, email: user.email, name: user.name },
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
