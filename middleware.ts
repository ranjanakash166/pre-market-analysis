export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Run for all pathnames except static assets and images.
     * Exclude /api/cron/* so Vercel Cron (GET) never loads Auth.js middleware — production
     * requires AUTH_SECRET and would throw MissingSecret before the cron route runs.
     * /api/auth and /login are still allowed inside `authorized` in auth.ts when matched.
     */
    "/((?!api/cron|api/webhooks/razorpay|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
