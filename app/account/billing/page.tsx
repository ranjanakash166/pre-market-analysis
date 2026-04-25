import Link from "next/link";
import { auth } from "@/auth";
import { getLatestSubscriptionByUser, listPaymentsByUser } from "@/lib/billing-db";

function money(paise: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(paise / 100);
}

export default async function BillingPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <p className="text-slate-300">Please sign in to view billing.</p>
      </main>
    );
  }

  const [subscription, payments] = await Promise.all([
    getLatestSubscriptionByUser(userId),
    listPaymentsByUser(userId),
  ]);

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-4 py-10 md:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Billing</h1>
          <p className="mt-2 text-slate-400">Manage your active plan and payment history.</p>
        </div>
        <Link
          href="/subscribe"
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white"
        >
          Change Plan
        </Link>
      </header>

      <section className="mb-8 rounded-2xl border border-white/[0.12] bg-[rgb(15_23_42_/0.65)] p-6">
        <h2 className="text-lg font-semibold text-white">Current subscription</h2>
        {subscription ? (
          <div className="mt-3 space-y-1 text-sm text-slate-300">
            <p>
              Plan: <span className="font-semibold text-white">{subscription.planCode}</span>
            </p>
            <p>
              Status: <span className="font-semibold text-white">{subscription.status}</span>
            </p>
            <p>
              Period end:{" "}
              <span className="font-semibold text-white">
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleString("en-IN")
                  : "N/A"}
              </span>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No active subscription yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.12] bg-[rgb(15_23_42_/0.65)] p-6">
        <h2 className="text-lg font-semibold text-white">Recent payments</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400">
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Plan</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-slate-500">
                    No payments recorded.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.06] text-slate-300">
                    <td className="px-2 py-3">{new Date(p.createdAt).toLocaleString("en-IN")}</td>
                    <td className="px-2 py-3">{p.planCode ?? "-"}</td>
                    <td className="px-2 py-3">{money(p.amountPaise, p.currency)}</td>
                    <td className="px-2 py-3">{p.status}</td>
                    <td className="px-2 py-3">{p.providerPaymentId ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
