import { auth } from "@/auth";
import { PositionSizeCalculator } from "@/components/position-size/position-size-calculator";
import { pageTitle } from "@/lib/branding";

export const metadata = {
  title: pageTitle("Position Size"),
  description:
    "Risk-first position sizing calculator — size every trade so a stop-loss hit never exceeds your risk cap.",
};

export default async function PositionSizePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <p className="text-slate-300">Please sign in to use the position sizing calculator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
      <PositionSizeCalculator />
    </main>
  );
}
