"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Radio } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { NAV_FEATURE_LABEL, SITE_NAME } from "@/lib/branding";

function BrandMark() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25"
      aria-hidden
    >
      T
    </span>
  );
}

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const onLoginRoute = pathname === "/login";
  const onDashboard = pathname === "/";
  const onXFeed = pathname === "/x";
  const onLearn = pathname === "/learn" || pathname.startsWith("/learn/");
  const onSubscribe = pathname === "/subscribe";
  const onBilling = pathname === "/account/billing";
  const isLoggedIn = status === "authenticated" && !!session?.user?.id;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[rgb(2_6_23_/0.82)] backdrop-blur-xl backdrop-saturate-150">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3 transition">
          <BrandMark />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[15px] font-semibold tracking-tight text-white group-hover:text-amber-100">
              {SITE_NAME}
            </span>
            <span className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 group-hover:text-slate-400">
              {NAV_FEATURE_LABEL}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!onLoginRoute ? (
            <Link
              href={isLoggedIn ? "/" : "/login"}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                onDashboard
                  ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 opacity-80" aria-hidden />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          ) : null}

          {!onLoginRoute ? (
            <Link
              href="/x"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                onXFeed
                  ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              <Radio className="h-4 w-4 opacity-80" aria-hidden />
              <span className="hidden sm:inline">X feed</span>
            </Link>
          ) : null}

          {!onLoginRoute ? (
            <Link
              href="/learn"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                onLearn
                  ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              <BookOpen className="h-4 w-4 opacity-80" aria-hidden />
              <span className="hidden sm:inline">Learn</span>
            </Link>
          ) : null}

          {isLoggedIn ? (
            <>
              {!onSubscribe ? (
                <Link
                  href="/subscribe"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                >
                  Subscribe
                </Link>
              ) : null}
              {!onBilling ? (
                <Link
                  href="/account/billing"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                >
                  Billing
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full bg-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.14]"
              >
                Sign out
              </button>
            </>
          ) : !onLoginRoute ? (
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105 active:brightness-95"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
