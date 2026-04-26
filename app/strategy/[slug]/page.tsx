import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ShieldCheck, Target } from "lucide-react";
import { loadStrategy, loadStrategyCatalog } from "@/lib/strategies-data";
import { pageTitle } from "@/lib/branding";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const catalog = await loadStrategyCatalog();
  return catalog.strategies.map((strategy) => ({ slug: strategy.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const strategy = await loadStrategy(slug);
    return {
      title: pageTitle(strategy.title),
      description: strategy.summary,
    };
  } catch {
    return { title: pageTitle("Strategy") };
  }
}

function snapshotRows(snapshot: {
  script: string;
  duration: string;
  expiry: string;
  entryDate: string;
  entryTime: string;
  target: string;
  stopLoss: string;
  debitOnDownside?: string;
  maxCredit?: string;
}): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Script", value: snapshot.script },
    { label: "Duration", value: snapshot.duration },
    { label: "Expiry", value: snapshot.expiry },
    { label: "Entry date", value: snapshot.entryDate },
    { label: "Entry time", value: snapshot.entryTime },
    { label: "Target", value: snapshot.target },
    { label: "Stop loss", value: snapshot.stopLoss },
  ];
  if (snapshot.debitOnDownside) {
    rows.push({ label: "Debit on downside", value: snapshot.debitOnDownside });
  }
  if (snapshot.maxCredit) {
    rows.push({ label: "Max credit", value: snapshot.maxCredit });
  }
  return rows;
}

export default async function StrategyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let strategy;
  try {
    strategy = await loadStrategy(slug);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8 md:pt-10">
      <Link
        href="/strategy"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-amber-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All strategies
      </Link>

      <header className="mb-10 max-w-4xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-500/90">
          {strategy.category}
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">{strategy.title}</h1>
        <p className="text-sm leading-relaxed text-slate-400 md:text-[15px]">{strategy.summary}</p>
      </header>

      <section className="mb-10 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-5 backdrop-blur-sm md:p-7">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Strategy snapshot</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {snapshotRows(strategy.snapshot).map((item) => (
            <div key={item.label} className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>
        {strategy.riskFirstNote ? (
          <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/25 px-4 py-3 text-sm leading-relaxed text-amber-50">
            <span className="font-semibold text-amber-200">Risk first: </span>
            {strategy.riskFirstNote}
          </p>
        ) : null}
      </section>

      <section className="mb-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25 shadow-2xl shadow-black/25">
        <div className="border-b border-white/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Strategy diagram
        </div>
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={strategy.image.src}
            alt={strategy.image.alt}
            fill
            className="object-contain bg-black/30"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-5 backdrop-blur-sm md:p-7">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Strike selection</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {strategy.strikeSelection.map((leg) => (
            <div key={leg.label} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">{leg.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{leg.distanceFromSpot}</p>
              <p className="mt-2 text-sm text-slate-300">
                {leg.side} {leg.optionType} · Weight {leg.weight}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-5 backdrop-blur-sm md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            <Target className="h-4 w-4 text-amber-500/85" aria-hidden />
            Execution rules
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
            {strategy.rules.map((rule) => (
              <li key={rule} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/90" aria-hidden />
                {rule}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-5 backdrop-blur-sm md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-cyan-400/85" aria-hidden />
            Risk notes
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
            {strategy.riskNotes.map((note) => (
              <li key={note} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" aria-hidden />
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-dashed border-white/[0.1] bg-black/20 px-5 py-4 text-xs leading-relaxed text-slate-500 md:px-6">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          <AlertTriangle className="h-4 w-4 text-amber-400/90" aria-hidden />
          Important
        </p>
        {strategy.disclaimer.map((line) => (
          <p key={line} className="mb-2 last:mb-0">
            {line}
          </p>
        ))}
      </section>
    </main>
  );
}
