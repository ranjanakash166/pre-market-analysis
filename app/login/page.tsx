"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { SITE_NAME } from "@/lib/branding";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const title = useMemo(() => (tab === "login" ? "Welcome back" : "Create account"), [tab]);
  const subtitle = useMemo(
    () => (tab === "login" ? "Sign in to your account" : "Join us today"),
    [tab],
  );
  async function continueWithGoogle() {
    setLoadingGoogle(true);
    setError(null);
    setNotice(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
      setLoadingGoogle(false);
    }
  }

  async function onSubmitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setUnverifiedEmail(null);
    setLoadingForm(true);
    try {
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");
      const out = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      if (!out || out.error) {
        const statusRes = await fetch(`/api/auth/verify-email/status?email=${encodeURIComponent(email)}`).catch(
          () => null,
        );
        const status = (await statusRes?.json().catch(() => ({}))) as {
          exists?: boolean;
          verified?: boolean;
        };
        if (status.exists && status.verified === false) {
          setUnverifiedEmail(email);
          setError("Your email is not verified yet. Please verify your email to continue.");
          setLoadingForm(false);
          return;
        } else {
          setError("Invalid email/password or account not found.");
        }
        setLoadingForm(false);
        return;
      }
      window.location.href = out.url ?? "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setLoadingForm(false);
    }
  }

  async function onSubmitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoadingForm(true);
    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");
      const confirmPassword = String(form.get("confirmPassword") ?? "");
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoadingForm(false);
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Registration failed");
        setLoadingForm(false);
        return;
      }
      window.location.href = `/verify-email?status=pending&email=${encodeURIComponent(email)}`;
      setLoadingForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      setLoadingForm(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.08),transparent_45%),radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.1),transparent_48%)] px-4 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="w-full max-w-xl">
        <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          {SITE_NAME}
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-base text-slate-400">{subtitle}</p>
        </div>

        <div className="rounded-[28px] border border-white/[0.12] bg-[rgb(10_14_34_/0.82)] p-7 shadow-[0_30px_80px_rgba(3,7,18,0.55)] backdrop-blur-2xl md:p-8">
          <div className="-mt-2 mb-8 grid grid-cols-2 rounded-xl bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === "login"
                  ? "bg-gradient-to-r from-indigo-500/30 to-cyan-400/30 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === "register"
                  ? "bg-gradient-to-r from-indigo-500/30 to-cyan-400/30 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>

          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={loadingGoogle || loadingForm}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg className="h-5 w-5 shrink-0" aria-hidden viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 10.2v3.98h5.64c-.24 1.28-.96 2.37-2.04 3.1l3.3 2.56c1.92-1.76 3.03-4.35 3.03-7.44 0-.73-.06-1.43-.2-2.1H12z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.3-2.56c-.9.6-2.06.95-3.31.95-2.55 0-4.71-1.72-5.48-4.03H3.1v2.62A9.98 9.98 0 0 0 12 22z"
              />
              <path
                fill="#FBBC05"
                d="M6.52 13.92a5.99 5.99 0 0 1 0-3.84V7.46H3.1a10 10 0 0 0 0 9.08l3.42-2.62z"
              />
              <path
                fill="#4285F4"
                d="M12 6.04c1.47 0 2.79.5 3.82 1.48l2.87-2.87A9.93 9.93 0 0 0 12 2 9.98 9.98 0 0 0 3.1 7.46l3.42 2.62c.77-2.31 2.93-4.04 5.48-4.04z"
              />
            </svg>
            {loadingGoogle ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">or</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {tab === "login" ? (
            <form className="space-y-4" onSubmit={onSubmitLogin}>
              <label className="block text-sm text-slate-300">
                Email address
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Password
                <input
                  required
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Enter your password"
                />
              </label>
              <button
                type="submit"
                disabled={loadingForm || loadingGoogle}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingForm ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onSubmitRegister}>
              <label className="block text-sm text-slate-300">
                Full name
                <input
                  required
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Your full name"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Email address
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Password
                <input
                  required
                  name="password"
                  minLength={6}
                  type="password"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Min. 6 characters"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Confirm password
                <input
                  required
                  name="confirmPassword"
                  minLength={6}
                  type="password"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Re-enter your password"
                />
              </label>
              <button
                type="submit"
                disabled={loadingForm || loadingGoogle}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingForm ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          )}

          {error ? <p className="mt-4 text-sm font-medium text-rose-400">{error}</p> : null}
          {notice ? <p className="mt-4 text-sm font-medium text-cyan-300">{notice}</p> : null}
          {unverifiedEmail ? (
            <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] p-3 text-sm text-amber-100">
              <p className="mb-2">
                Please verify <span className="font-semibold">{unverifiedEmail}</span> before logging in.
              </p>
              <Link
                href={`/verify-email?status=pending&email=${encodeURIComponent(unverifiedEmail)}`}
                className="inline-flex rounded-lg border border-amber-300/35 px-3 py-1.5 font-semibold text-amber-100 transition hover:bg-amber-400/10"
              >
                Go to verification page
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
