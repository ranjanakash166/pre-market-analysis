"use client";

import { useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Layers3, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { FEATURE_PRE_MARKET, SITE_NAME, SITE_TAGLINE } from "@/lib/branding";

export default function HomePage() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal-on-scroll"));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
      <section className="landing-fade-up rounded-3xl border border-white/[0.09] bg-[rgb(8_12_28_/0.72)] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400/95">{SITE_NAME}</p>
        <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Pre-market clarity in minutes, not chaos in tabs
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
          {FEATURE_PRE_MARKET} built for serious traders. {SITE_TAGLINE} Get A/B/C mode intelligence, market context, and
          decision-ready insights before the first candle.
        </p>
        <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href="/login"
            className="landing-pulse inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105 sm:w-72"
          >
            Login to access dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/login?tab=register"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] sm:w-72"
          >
            Register free account
          </Link>
        </div>
        <div className="mt-8 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
          <div className="landing-float rounded-xl border border-white/[0.1] bg-black/20 p-3">
            <p className="font-semibold text-white">A mode</p>
            <p className="mt-1 text-slate-400">Intraday pre-open setup, key levels, and opening bias.</p>
          </div>
          <div className="landing-float rounded-xl border border-white/[0.1] bg-black/20 p-3 [animation-delay:200ms]">
            <p className="font-semibold text-white">B mode</p>
            <p className="mt-1 text-slate-400">Swing context with multi-session structure and rotation watchlist.</p>
          </div>
          <div className="landing-float rounded-xl border border-white/[0.1] bg-black/20 p-3 [animation-delay:400ms]">
            <p className="font-semibold text-white">C mode</p>
            <p className="mt-1 text-slate-400">Full thesis including volatility, macro, flows, and scenarios.</p>
          </div>
        </div>
      </section>

      <section id="features" className="reveal-on-scroll mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">What you get before market open</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400 md:text-base">
          One place to understand trend, risk, and opportunity. No over-analysis. No scattered screenshots.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Layers3,
              title: "A/B/C trader modes",
              copy: "Switch between intraday, swing, and full report context depending on your horizon.",
            },
            {
              icon: Radar,
              title: "Signal + context",
              copy: "Reports combine levels, volatility posture, and narrative so you see why a setup matters.",
            },
            {
              icon: Sparkles,
              title: "AI-generated briefings",
              copy: "Regenerate in one click and get an updated market view with clear verdict and confidence.",
            },
            {
              icon: ShieldCheck,
              title: "Source-backed intelligence",
              copy: "Every report includes source links so you can verify the information quickly.",
            },
          ].map((item, index) => (
            <article
              key={item.title}
              className="reveal-on-scroll rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.48)] p-5"
              style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties}
            >
              <item.icon className="h-5 w-5 text-amber-400" aria-hidden />
              <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="reveal-on-scroll mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { step: "01", title: "Login & choose mode", copy: "Start with A, B, or C mode based on your strategy." },
            {
              step: "02",
              title: "Generate market briefing",
              copy: "Pull a fresh report built for India pre-market context and session preparation.",
            },
            {
              step: "03",
              title: "Trade with clear scenarios",
              copy: "Use verdict, confidence, levels, and sources to frame your risk and entries.",
            },
          ].map((item, index) => (
            <article
              key={item.step}
              className="reveal-on-scroll rounded-2xl border border-white/[0.08] bg-black/20 p-5"
              style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">{item.step}</p>
              <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="x-feed-analysis"
        className="reveal-on-scroll mt-14 scroll-mt-24 rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.45)] p-6 md:p-8"
      >
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">X feed analysis that catches what charts miss</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
          Our X feed module tracks high-signal market posts and summarizes narrative shifts so you can spot momentum, fear,
          and sector rotation early. This is one of the strongest edge-builders for fast Indian market decision making.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <h3 className="text-base font-semibold text-white">Signal filtering</h3>
            <p className="mt-2 text-sm text-slate-400">
              Noise is removed so only relevant posts and accounts stay in your workflow.
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <h3 className="text-base font-semibold text-white">Market sentiment heat</h3>
            <p className="mt-2 text-sm text-slate-400">
              Track bullish and bearish narrative changes around indices, sectors, and major stocks.
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <h3 className="text-base font-semibold text-white">Actionable setup cues</h3>
            <p className="mt-2 text-sm text-slate-400">
              Convert social intelligence into practical watchlist ideas and scenario planning.
            </p>
          </article>
        </div>
      </section>

      <section
        id="learn-module"
        className="reveal-on-scroll mt-14 scroll-mt-24 rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.05] p-6 md:p-8"
      >
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Learn module to build profitable habits</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-100/90 md:text-base">
          Beyond daily reports, Twickers helps traders grow. The Learn module breaks down key concepts so users trade with
          process, discipline, and better risk-adjusted decision making.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <h3 className="text-base font-semibold text-white">Structured learning path</h3>
            <p className="mt-2 text-sm text-slate-300">
              Start from foundational concepts and move to execution frameworks used by active traders.
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <h3 className="text-base font-semibold text-white">Concept to market mapping</h3>
            <p className="mt-2 text-sm text-slate-300">
              Learn why setups work, where they fail, and how to adapt in real market conditions.
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
            <h3 className="text-base font-semibold text-white">Consistency over tips</h3>
            <p className="mt-2 text-sm text-slate-300">
              Build a repeatable process that improves your confidence, entries, and exits over time.
            </p>
          </article>
        </div>
      </section>

      <section
        id="pricing"
        className="reveal-on-scroll mt-14 scroll-mt-24 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.05] p-6 md:p-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Start free. Upgrade when you want depth.</h2>
            <p className="mt-2 max-w-3xl text-sm text-cyan-100/85 md:text-base">
              Free users can explore all modes and generate A mode. Paid users unlock unlimited generation across B/C for
              serious prep.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-cyan-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Mode A generation available on free tier
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Unlimited B/C generation on paid plans
              </li>
              <li className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" aria-hidden />
                Fast daily workflow: scan, decide, execute
              </li>
            </ul>
          </div>
          <div className="flex shrink-0 flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-center text-sm font-extrabold text-slate-950 transition hover:brightness-105 sm:w-56"
            >
              Login now
            </Link>
            <Link
              href="/login?tab=register"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/[0.14] px-5 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06] sm:w-56"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <section className="reveal-on-scroll mt-14 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Ready to see your first pre-market brief?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
          Join now and open your personalized dashboard in under a minute.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:brightness-105"
        >
          Login / Register
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <footer className="reveal-on-scroll relative left-1/2 right-1/2 mt-16 w-screen -translate-x-1/2 border-t border-white/[0.12] bg-black/80 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{SITE_NAME}</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                AI-powered market prep for Indian traders: pre-market briefings, X feed intelligence, and practical
                learning.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Link href="/#features" className="text-slate-300 transition hover:text-white">
                Features
              </Link>
              <Link href="/#x-feed-analysis" className="text-slate-300 transition hover:text-white">
                X feed
              </Link>
              <Link href="/#learn-module" className="text-slate-300 transition hover:text-white">
                Learn
              </Link>
              <Link href="/#pricing" className="text-slate-300 transition hover:text-white">
                Pricing
              </Link>
              <Link href="/login" className="text-slate-300 transition hover:text-white">
                Login
              </Link>
              <Link href="/login?tab=register" className="text-slate-300 transition hover:text-white">
                Register
              </Link>
            </div>
          </div>
          <p className="mt-10 text-xs text-slate-500">© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
