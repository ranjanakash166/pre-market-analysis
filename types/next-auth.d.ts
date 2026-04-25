import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      emailVerified?: boolean;
      authProvider?: "google" | "credentials" | null;
      planCode?: string | null;
      subscriptionStatus?: string | null;
      hasActiveSubscription?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    emailVerified?: boolean;
    authProvider?: "google" | "credentials" | null;
    planCode?: string | null;
    subscriptionStatus?: string | null;
    hasActiveSubscription?: boolean;
  }
}
