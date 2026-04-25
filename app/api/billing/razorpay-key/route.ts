import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRazorpayKeyId } from "@/lib/razorpay";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ keyId: getRazorpayKeyId() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Razorpay key" },
      { status: 500 },
    );
  }
}
