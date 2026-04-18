import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const providers: NextAuthConfig["providers"] = [];
if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
    }),
  );
} else {
  /** Keeps `/api/auth/session` healthy when Google OAuth is not configured (returns null session). */
  providers.push(
    Credentials({
      id: "credentials-not-configured",
      name: "Configure Google OAuth",
      credentials: {},
      authorize: () => null,
    }),
  );
}

const authSecret =
  process.env.AUTH_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim() ||
  (process.env.NODE_ENV !== "production"
    ? "dev-only-auth-secret-replace-with-AUTH_SECRET-in-env-32chars"
    : undefined);

const config = {
  secret: authSecret,
  providers,
  pages: {
    signIn: "/login",
  },
  trustHost:
    process.env.AUTH_TRUST_HOST === "true" ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV !== "production",
  callbacks: {
    /**
     * Login is optional: guests can use `/`, `/api/report`, `/api/generate`, etc.
     * Add pathname checks here later for routes that must require a session.
     */
    authorized({ request, auth }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/api/auth")) return true;
      if (path.startsWith("/api/cron")) return true;

      const isLoggedIn = !!auth?.user;
      if (path === "/login" && isLoggedIn) {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
