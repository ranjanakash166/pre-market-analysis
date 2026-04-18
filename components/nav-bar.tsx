"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
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
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const onLoginRoute = pathname === "/login";
  const onDashboard = pathname === "/";

  const displayName =
    session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Signed in";

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
              href="/"
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

          {!onLoginRoute && status === "authenticated" ? (
            <>
              <div className="hidden h-8 w-px bg-white/10 sm:block" />

              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- external OAuth avatar URLs
                <img
                  src={session.user.image}
                  alt=""
                  className="hidden h-9 w-9 rounded-full border border-white/10 shadow-md sm:block"
                  width={36}
                  height={36}
                />
              ) : null}

              <span
                className="hidden max-w-[9rem] truncate text-sm text-slate-300 lg:inline"
                title={session?.user?.email ?? undefined}
              >
                {displayName}
              </span>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/[0.15] hover:bg-white/[0.1]"
              >
                Sign out
              </button>
            </>
          ) : null}

          {!onLoginRoute && status === "unauthenticated" ? (
            <button
              type="button"
              disabled
              title="Sign-in will be live soon so you can log in and get more useful insights."
              className="cursor-not-allowed rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-500 ring-1 ring-white/[0.06]"
            >
              Sign in — coming soon
            </button>
          ) : null}

          {status === "loading" && !onLoginRoute ? (
            <span className="text-xs text-slate-500">Loading…</span>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
