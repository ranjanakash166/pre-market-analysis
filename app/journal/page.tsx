import { Suspense } from "react";
import { auth } from "@/auth";
import { JournalManager } from "@/components/trading-journal/journal-manager";
import { pageTitle } from "@/lib/branding";

export const metadata = {
  title: pageTitle("Trading Journal"),
  description: "Journal your trades, review process mistakes, and track execution consistency inside Twickers.",
};

export default async function JournalPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <p className="text-slate-300">Please sign in to view your trading journal.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-8 text-sm text-slate-400">
            Loading your journal…
          </div>
        }
      >
        <JournalManager />
      </Suspense>
    </main>
  );
}
