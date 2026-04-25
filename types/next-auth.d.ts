import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      planCode?: string | null;
      subscriptionStatus?: string | null;
      hasActiveSubscription?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    planCode?: string | null;
    subscriptionStatus?: string | null;
    hasActiveSubscription?: boolean;
  }
}
