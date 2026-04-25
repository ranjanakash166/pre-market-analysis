import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authDbAvailable,
  getActiveSubscriptionSnapshot,
  getCredentialsByEmail,
  getUserByEmail,
  upsertGoogleUser,
} from "@/lib/auth-db";
import { verifyPassword } from "@/lib/auth-password";

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

const credentialsInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

providers.push(
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      if (!authDbAvailable()) return null;
      const parsed = credentialsInputSchema.safeParse(raw);
      if (!parsed.success) return null;
      const record = await getCredentialsByEmail(parsed.data.email);
      if (!record) return null;
      const ok = await verifyPassword(parsed.data.password, record.passwordHash);
      if (!ok) return null;
      return {
        id: record.user.id,
        email: record.user.email,
        name: record.user.name ?? record.user.email,
        image: record.user.image ?? undefined,
      };
    },
  }),
);

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
      if (path.startsWith("/api/webhooks/razorpay")) return true;
      if (path.startsWith("/api/public/")) return true;
      if (path.startsWith("/api/billing")) return !!auth?.user;
      if (path.startsWith("/api/")) return true;

      const isLoggedIn = !!auth?.user;
      if (path === "/login" && isLoggedIn) {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }

      if (path === "/login") return true;

      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", request.nextUrl));
      }

      return true;
    },
    async signIn({ user, account }) {
      if (!authDbAvailable()) return true;
      if (account?.provider !== "google") return true;
      if (!user.email || !account.providerAccountId) return false;
      const persisted = await upsertGoogleUser({
        email: user.email,
        name: user.name,
        image: user.image,
        providerAccountId: account.providerAccountId,
      });
      user.id = persisted.id;
      return true;
    },
    async jwt({ token, user }) {
      if (!authDbAvailable()) return token;

      let userId =
        typeof user?.id === "string" && uuidRegex.test(user.id)
          ? user.id
          : typeof token.sub === "string" && uuidRegex.test(token.sub)
            ? token.sub
            : null;

      if (!userId && typeof token.email === "string") {
        const byEmail = await getUserByEmail(token.email);
        userId = byEmail?.id ?? null;
      }

      if (!userId) return token;

      const sub = await getActiveSubscriptionSnapshot(userId);
      token.planCode = sub.planCode;
      token.subscriptionStatus = sub.status;
      token.hasActiveSubscription = sub.hasAccess;
      token.sub = userId;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = typeof token.sub === "string" ? token.sub : undefined;
        (session.user as { planCode?: string | null }).planCode =
          typeof token.planCode === "string" ? token.planCode : null;
        (session.user as { subscriptionStatus?: string | null }).subscriptionStatus =
          typeof token.subscriptionStatus === "string" ? token.subscriptionStatus : null;
        (session.user as { hasActiveSubscription?: boolean }).hasActiveSubscription =
          token.hasActiveSubscription === true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
