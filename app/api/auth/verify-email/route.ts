import { NextRequest, NextResponse } from "next/server";
import { consumeVerificationToken, verificationDbReady } from "@/lib/auth-verification";

export async function GET(request: NextRequest) {
  if (!verificationDbReady()) {
    return NextResponse.redirect(new URL("/verify-email?status=setup", request.nextUrl));
  }

  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", request.nextUrl));
  }

  const result = await consumeVerificationToken(token);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/verify-email?status=${result.reason ?? "invalid"}`, request.nextUrl),
    );
  }
  return NextResponse.redirect(new URL("/verify-email?status=success", request.nextUrl));
}

