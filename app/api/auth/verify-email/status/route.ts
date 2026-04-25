import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authDbAvailable, getUserByEmail } from "@/lib/auth-db";

const statusSchema = z.object({
  email: z.string().trim().email(),
});

export async function GET(request: NextRequest) {
  if (!authDbAvailable()) {
    return NextResponse.json({ verified: false, exists: false, setup: false });
  }

  const parsed = statusSchema.safeParse({
    email: request.nextUrl.searchParams.get("email") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ verified: false, exists: false }, { status: 400 });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return NextResponse.json({ exists: false, verified: false });
  }

  return NextResponse.json({
    exists: true,
    verified: Boolean(user.emailVerifiedAt),
  });
}

