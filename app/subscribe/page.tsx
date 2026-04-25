"use client";

import { useEffect, useMemo, useState } from "react";

type BillingPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  amountPaise: number;
  currency: string;
  billingType: "recurring" | "one_time";
  intervalUnit: "day" | "week" | "month" | "year" | null;
  intervalCount: number | null;
};

type CheckoutResponse = {
  mode: "one_time" | "recurring";
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  amountPaise: number;
  currency: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function money(paise: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(paise / 100);
}

function labelForPlan(plan: BillingPlan): string {
  if (plan.billingType === "one_time") return "One-time";
  const interval = plan.intervalUnit ?? "month";
  const count = plan.intervalCount ?? 1;
  return count > 1 ? `Every ${count} ${interval}s` : `Per ${interval}`;
}

export default function SubscribePage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/billing/plans", { cache: "no-store" });
        const json = (await res.json()) as { plans?: BillingPlan[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to load plans");
        setPlans(json.plans ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const grouped = useMemo(() => {
    return plans.reduce<Record<string, BillingPlan[]>>((acc, p) => {
      const key = p.code.split("_")[0] ?? p.code;
      acc[key] = acc[key] ?? [];
      acc[key].push(p);
      return acc;
    }, {});
  }, [plans]);

  async function startCheckout(planCode: string) {
    setBusyPlan(planCode);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const out = (await res.json()) as CheckoutResponse & { error?: string };
      if (!res.ok) throw new Error(out.error ?? "Failed to initialize checkout");
      if (!window.Razorpay) throw new Error("Razorpay SDK not loaded");

      const keyRes = await fetch("/api/billing/razorpay-key", { cache: "no-store" });
      const keyJson = (await keyRes.json()) as { keyId?: string; error?: string };
      if (!keyRes.ok || !keyJson.keyId) throw new Error(keyJson.error ?? "Missing Razorpay key");

      const options: Record<string, unknown> = {
        key: keyJson.keyId,
        name: "Twickers",
        description: "Subscription checkout",
        theme: { color: "#6366f1" },
        currency: out.currency,
      };

      if (out.mode === "one_time" && out.razorpayOrderId) {
        options.order_id = out.razorpayOrderId;
        options.amount = out.amountPaise;
        options.handler = async (resp: Record<string, string>) => {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (!verify.ok) {
            const err = (await verify.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error ?? "Payment verification failed");
          }
          window.location.href = "/";
        };
      } else if (out.mode === "recurring" && out.razorpaySubscriptionId) {
        options.subscription_id = out.razorpaySubscriptionId;
        options.handler = () => {
          window.location.href = "/account/billing";
        };
      } else {
        throw new Error("Invalid checkout mode payload");
      }

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl px-4 py-12 md:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Choose your plan</h1>
        <p className="mt-2 text-slate-400">
          You are signed in. Activate a subscription to access all features.
        </p>
      </div>

      {loading ? <p className="text-center text-slate-400">Loading plans...</p> : null}
      {error ? <p className="mb-6 text-center text-rose-400">{error}</p> : null}

      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(grouped).map(([tier, tierPlans]) => (
          <section
            key={tier}
            className="rounded-2xl border border-white/[0.12] bg-[rgb(15_23_42_/0.65)] p-6 shadow-xl shadow-black/25"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{tier}</p>
            <div className="mt-4 space-y-4">
              {tierPlans.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{plan.description ?? "Plan access"}</p>
                  <p className="mt-3 text-2xl font-bold text-white">
                    {money(plan.amountPaise, plan.currency)}
                  </p>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    {labelForPlan(plan)}
                  </p>
                  <button
                    type="button"
                    onClick={() => startCheckout(plan.code)}
                    disabled={busyPlan != null}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyPlan === plan.code ? "Opening checkout..." : "Subscribe"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
