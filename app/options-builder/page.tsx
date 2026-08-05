import { auth } from "@/auth";
import { OptionsStrategyBuilder } from "@/components/options-builder/options-strategy-builder";
import { pageTitle } from "@/lib/branding";

export const metadata = {
  title: pageTitle("Options Builder"),
  description:
    "Interactive at-expiry payoff diagrams for 38 options strategies — break-even, max profit, and max loss.",
};

export default async function OptionsBuilderPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <p className="text-slate-300">Please sign in to use the options strategy builder.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
      <OptionsStrategyBuilder />
    </main>
  );
}
