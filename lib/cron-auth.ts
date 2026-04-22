import type { NextRequest } from "next/server";

/**
 * Authorize cron routes. `CRON_SECRET` must be set in env.
 * - Manual / custom callers: `x-cron-token: <CRON_SECRET>`
 * - Vercel scheduled crons: `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in the project
 *   (see Vercel cron docs).
 */
export function isCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }
  const custom = request.headers.get("x-cron-token");
  if (custom === expected) {
    return true;
  }
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const bearer = auth.slice(7).trim();
    if (bearer === expected) {
      return true;
    }
  }
  return false;
}
