"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SITE_NAME } from "@/lib/branding";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "pending";
  const emailFromQuery = searchParams.get("email") ?? "";

  const [verificationEmail, setVerificationEmail] = useState(emailFromQuery);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingResend, setLoadingResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (status === "success") {
      setNotice("Your email is verified. You can now sign in.");
      setError(null);
      return;
    }
    if (status === "expired") {
      setError("Verification link expired. Request a new one below.");
      return;
    }
    if (status === "used") {
      setNotice("This link was already used. Please sign in.");
      return;
    }
    if (status === "setup") {
      setError("Email verification is not configured on the server.");
      return;
    }
    if (status === "invalid") {
      setError("This verification link is invalid.");
      return;
    }
    setNotice("Check your inbox and click the verification link.");
    setError(null);
  }, [status]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function resendVerification() {
    if (!verificationEmail || loadingResend || resendCooldown > 0) return;
    setLoadingResend(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        cooldownSeconds?: number;
        message?: string;
      };
      if (!res.ok) {
        if (typeof json.cooldownSeconds === "number") {
          setResendCooldown(json.cooldownSeconds);
        }
        setError(json.error ?? "Could not resend verification email.");
        return;
      }
      setNotice(json.message ?? "Verification email sent.");
      setResendCooldown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend verification email.");
    } finally {
      setLoadingResend(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center px-4 py-16">
      <section className="w-full rounded-3xl border border-white/[0.12] bg-[rgb(10_14_34_/0.82)] p-7 shadow-[0_30px_80px_rgba(3,7,18,0.55)] backdrop-blur-2xl md:p-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{SITE_NAME}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-400">
          Complete verification to unlock dashboard access for credentials login.
        </p>

        <div className="mt-6 space-y-4">
          {error ? <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">{error}</p> : null}
          {notice ? <p className="rounded-xl bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200">{notice}</p> : null}

          {status !== "success" ? (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] p-4">
              <label className="block text-sm text-slate-300">
                Email address
                <input
                  type="email"
                  value={verificationEmail}
                  onChange={(event) => setVerificationEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>
              <button
                type="button"
                onClick={resendVerification}
                disabled={loadingResend || resendCooldown > 0 || !verificationEmail}
                className="mt-3 rounded-lg border border-cyan-300/35 px-3 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingResend
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend verification email"}
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {status !== "success" ? (
              <a
                href="https://mail.google.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-cyan-300/35 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
              >
                Open Gmail
              </a>
            ) : null}
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-extrabold text-white transition hover:brightness-110"
            >
              Go to login
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/[0.15] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

