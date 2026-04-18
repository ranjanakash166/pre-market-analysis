export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Run for all pathnames except static assets and images.
     * /api/cron, /api/auth, and /login are allowed inside `authorized` in auth.ts.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
