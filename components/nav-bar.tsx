"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calculator, CalendarDays, Compass, LayoutDashboard, Menu, NotebookPen, Radio, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { SITE_NAME } from "@/lib/branding";

function BrandMark() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M6 5v14" />
        <rect x="4.5" y="9" width="3" height="6" rx="0.7" fill="currentColor" stroke="none" />
        <path d="M12 4v16" />
        <rect x="10.5" y="6.5" width="3" height="8.5" rx="0.7" fill="currentColor" stroke="none" />
        <path d="M18 6v13" />
        <rect x="16.5" y="11" width="3" height="4.5" rx="0.7" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onLoginRoute = pathname === "/login";
  const onLanding = pathname === "/";
  const onDashboard = pathname === "/dashboard";
  const onXFeed = pathname === "/x";
  const onJournal = pathname === "/journal";
  const onPositionSize = pathname === "/position-size";
  const onPriorDay = pathname === "/prior-day" || pathname.startsWith("/prior-day/");
  const onLearn = pathname === "/learn" || pathname.startsWith("/learn/");
  const onStrategy = pathname === "/strategy" || pathname.startsWith("/strategy/");
  const onSubscribe = pathname === "/subscribe";
  const onBilling = pathname === "/account/billing";
  const isLoggedIn = status === "authenticated" && !!session?.user?.id;
  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[rgb(2_6_23_/0.82)] backdrop-blur-xl backdrop-saturate-150">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="group flex min-w-0 items-center gap-3 transition">
          <BrandMark />
          <span className="truncate text-[15px] font-semibold tracking-tight text-white group-hover:text-amber-100">
            {SITE_NAME}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.08] md:hidden"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>

        <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  onDashboard
                    ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 opacity-80" aria-hidden />
                <span className="hidden sm:inline">Market Analysis</span>
              </Link>

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

              <Link
                href="/journal"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  onJournal
                    ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <NotebookPen className="h-4 w-4 opacity-80" aria-hidden />
                <span className="hidden sm:inline">Trading Journal</span>
              </Link>


              <Link
                href="/position-size"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  onPositionSize
                    ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <Calculator className="h-4 w-4 opacity-80" aria-hidden />
                <span className="hidden sm:inline">Position Size</span>
              </Link>

              <Link
                href="/prior-day"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  onPriorDay
                    ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <CalendarDays className="h-4 w-4 opacity-80" aria-hidden />
                <span className="hidden sm:inline">Prior day</span>
              </Link>

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

              <Link
                href="/strategy"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  onStrategy
                    ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <Compass className="h-4 w-4 opacity-80" aria-hidden />
                <span className="hidden sm:inline">Strategy</span>
              </Link>

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
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full bg-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.14]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {!onLoginRoute ? (
                <>
                  <Link
                    href="/#features"
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      onLanding ? "text-slate-200 hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Features
                  </Link>
                  <Link
                    href="/#how-it-works"
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      onLanding ? "text-slate-200 hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    How it works
                  </Link>
                  <Link
                    href="/#x-feed-analysis"
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      onLanding ? "text-slate-200 hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    X feed
                  </Link>
                  <Link
                    href="/#learn-module"
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      onLanding ? "text-slate-200 hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Learn
                  </Link>
                  <Link
                    href="/#pricing"
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      onLanding ? "text-slate-200 hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Pricing
                  </Link>
                </>
              ) : (
                <Link
                  href="/"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                >
                  Home
                </Link>
              )}
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Login
              </Link>
              <Link
                href="/login?tab=register"
                className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105 active:brightness-95"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-200 md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMenu}
        aria-hidden
      />
      <aside
        className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-[82vw] max-w-sm border-r border-white/[0.08] bg-[rgb(2_6_23_/0.98)] px-4 py-4 shadow-2xl shadow-black/40 transition-transform duration-250 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    onDashboard
                      ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  Market Analysis
                </Link>
                <Link
                  href="/x"
                  onClick={closeMenu}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    onXFeed
                      ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  X feed
                </Link>
                <Link
                  href="/journal"
                  onClick={closeMenu}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    onJournal
                      ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  Trading Journal
                </Link>


                <Link
                  href="/position-size"
                  onClick={closeMenu}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    onPositionSize
                      ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  Position Size
                </Link>
                <Link
                  href="/prior-day"
                  onClick={closeMenu}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    onPriorDay
                      ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  Prior day
                </Link>
                <Link
                  href="/learn"
                  onClick={closeMenu}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    onLearn
                      ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  Learn
                </Link>
                <Link
                  href="/strategy"
                  onClick={closeMenu}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    onStrategy
                      ? "bg-white/[0.07] text-amber-100 ring-1 ring-amber-500/25"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  Strategy
                </Link>
                {!onSubscribe ? (
                  <Link
                    href="/subscribe"
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                  >
                    Subscribe
                  </Link>
                ) : null}
                {!onBilling ? (
                  <Link
                    href="/account/billing"
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                  >
                    Billing
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    void signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-xl bg-white/[0.08] px-3 py-2 text-left text-sm font-semibold text-slate-100 transition hover:bg-white/[0.14]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                {!onLoginRoute ? (
                  <>
                    <Link
                      href="/#features"
                      onClick={closeMenu}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                    >
                      Features
                    </Link>
                    <Link
                      href="/#x-feed-analysis"
                      onClick={closeMenu}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                    >
                      X feed analysis
                    </Link>
                    <Link
                      href="/#learn-module"
                      onClick={closeMenu}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                    >
                      Learn
                    </Link>
                    <Link
                      href="/#pricing"
                      onClick={closeMenu}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                    >
                      Pricing
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
                  >
                    Home
                  </Link>
                )}
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-xl border border-white/[0.12] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Login
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={closeMenu}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>
      </aside>
    </nav>
  );
}
