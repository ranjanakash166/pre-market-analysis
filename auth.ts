import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

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
      const parsed = credentialsInputSchema.safeParse(raw);
      if (!parsed.success) return null;
      const [{ authDbAvailable, getCredentialsByEmail }, { verifyPassword }] = await Promise.all([
        import("@/lib/auth-db"),
        import("@/lib/auth-password"),
      ]);
      if (!authDbAvailable()) return null;
      const record = await getCredentialsByEmail(parsed.data.email);
      if (!record) return null;
      if (!record.user.emailVerifiedAt) return null;
      const ok = await verifyPassword(parsed.data.password, record.passwordHash);
      if (!ok) return null;
      return {
        id: record.user.id,
        email: record.user.email,
        name: record.user.name ?? record.user.email,
        image: record.user.image ?? undefined,
        emailVerified: true,
        authProvider: "credentials",
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
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
      }

      if (path === "/") return true;
      if (path === "/login") return true;
      if (path === "/verify-email") return true;

      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", request.nextUrl));
      }

      const isEmailVerified =
        (auth?.user as { emailVerified?: boolean } | undefined)?.emailVerified !== false;
      const authProvider = (auth?.user as { authProvider?: string } | undefined)?.authProvider;
      if (authProvider === "credentials" && !isEmailVerified) {
        const email = encodeURIComponent((auth?.user as { email?: string } | undefined)?.email ?? "");
        return NextResponse.redirect(new URL(`/verify-email?status=pending&email=${email}`, request.nextUrl));
      }

      return true;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email || !account.providerAccountId) return false;
      const { authDbAvailable, upsertGoogleUser } = await import("@/lib/auth-db");
      if (!authDbAvailable()) return true;
      const persisted = await upsertGoogleUser({
        email: user.email,
        name: user.name,
        image: user.image,
        providerAccountId: account.providerAccountId,
      });
      user.id = persisted.id;
      (user as { emailVerified?: boolean }).emailVerified = true;
      (user as { authProvider?: "google" }).authProvider = "google";
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.emailVerified =
          (user as { emailVerified?: boolean }).emailVerified === true ||
          (user as { emailVerifiedAt?: string | null }).emailVerifiedAt != null;
        token.authProvider =
          (user as { authProvider?: "google" | "credentials" }).authProvider ??
          (token.authProvider as "google" | "credentials" | null | undefined) ??
          null;
      }

      let userId =
        typeof user?.id === "string" && uuidRegex.test(user.id)
          ? user.id
          : typeof token.sub === "string" && uuidRegex.test(token.sub)
            ? token.sub
            : null;

      if (!userId) return token;
      token.sub = userId;
      const { authDbAvailable, getUserById } = await import("@/lib/auth-db");
      if (authDbAvailable()) {
        const record = await getUserById(userId);
        token.emailVerified = record?.emailVerifiedAt != null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = typeof token.sub === "string" ? token.sub : undefined;
        (session.user as { emailVerified?: boolean }).emailVerified = token.emailVerified === true;
        (session.user as { authProvider?: "google" | "credentials" | null }).authProvider =
          typeof token.authProvider === "string" ? (token.authProvider as "google" | "credentials") : null;
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
