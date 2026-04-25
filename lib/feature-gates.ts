import type { Session } from "next-auth";
import { getActiveSubscriptionSnapshot } from "@/lib/auth-db";

export const FREE_TIER_MAX_TWEET_PAGE = 10;
export const FREE_TIER_ALLOWED_GENERATE_MODES = new Set(["A"]);

export function hasActiveSubscription(session: Session | null | undefined): boolean {
  return session?.user?.hasActiveSubscription === true;
}

export function canGenerateMode(session: Session | null | undefined, mode: string): boolean {
  if (hasActiveSubscription(session)) return true;
  return FREE_TIER_ALLOWED_GENERATE_MODES.has(mode);
}

export async function hasPaidAccessForUser(userId: string): Promise<boolean> {
  const snap = await getActiveSubscriptionSnapshot(userId);
  return snap.hasAccess;
}
