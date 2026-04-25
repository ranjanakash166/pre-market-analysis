"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Clock3, Landmark, Sparkles } from "lucide-react";
import { SITE_NAME } from "@/lib/branding";

export default function LoginPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueWithGoogle() {
    setLoadingGoogle(true);
    setError(null);
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
        setError("Invalid email/password or account not found.");
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

      const out = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      if (!out || out.error) {
        setNotice("Account created. Please sign in.");
        setTab("login");
        setLoadingForm(false);
        return;
      }
      window.location.href = out.url ?? "/";
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

      <div className="w-full max-w-2xl">
        <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          {SITE_NAME}
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 text-base text-slate-400">
            Sign in to access your pre-market briefings, X-feed intelligence, and trader learning modules.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/[0.12] bg-[rgb(10_14_34_/0.82)] p-7 shadow-[0_30px_80px_rgba(3,7,18,0.55)] backdrop-blur-2xl md:p-8">
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.08] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <Sparkles className="h-4 w-4" aria-hidden />
              Fastest way to start: Continue with Google
            </p>
          </div>

          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={loadingGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-gradient-to-r from-white/[0.12] to-white/[0.06] px-4 py-3 text-sm font-bold text-slate-100 transition hover:from-white/[0.18] hover:to-white/[0.1] disabled:cursor-not-allowed disabled:opacity-70"
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
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>

          <div className="my-6 space-y-3">
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 text-sm">
              <p className="flex items-center justify-between gap-2 font-semibold text-amber-100">
                <span className="flex items-center gap-2">
                  <Landmark className="h-4 w-4" aria-hidden />
                  Login with broker
                </span>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] uppercase tracking-wide text-amber-200">
                  Coming soon
                </span>
              </p>
              <p className="mt-1 text-amber-100/70">Direct broker-linked sessions for faster trade execution workflow.</p>
            </div>
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06] px-4 py-3 text-sm">
              <p className="flex items-center justify-between gap-2 font-semibold text-indigo-100">
                <span className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" aria-hidden />
                  App registration
                </span>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] uppercase tracking-wide text-indigo-200">
                  Coming soon
                </span>
              </p>
              <p className="mt-1 text-indigo-100/70">Native signup flow will be enabled once broker-first onboarding is finalized.</p>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-rose-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
