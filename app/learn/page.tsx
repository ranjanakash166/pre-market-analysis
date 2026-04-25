import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { loadCourseCatalog } from "@/lib/courses-data";
import { pageTitle } from "@/lib/branding";

export const metadata: Metadata = {
  title: pageTitle("Learn"),
  description: "Structured trading tutorials with practical modules, takeaways, and guided learning paths.",
};

type LearnPageProps = {
  searchParams?: Promise<{ category?: string }>;
};

export default async function LearnIndexPage({ searchParams }: LearnPageProps) {
  const catalog = await loadCourseCatalog();
  const categories = [...new Set(catalog.courses.map((c) => c.category))].sort((a, b) => a.localeCompare(b));
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedCategory = resolvedSearchParams?.category;
  const activeCategory =
    requestedCategory && categories.includes(requestedCategory) ? requestedCategory : "All";
  const visibleCourses =
    activeCategory === "All"
      ? catalog.courses
      : catalog.courses.filter((c) => c.category === activeCategory);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8 md:pt-10">
      <div className="mb-10 md:mb-12">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-500/90">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          Learn
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Learn library</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 md:text-[15px]">
          Master trading concepts with practical learning paths built for real market decisions. Start free, then
          unlock Learn Pro for deeper modules, guided roadmaps, and faster skill-building.
        </p>
        <div className="mt-4">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105"
          >
            Upgrade to Learn Pro
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/learn"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            activeCategory === "All"
              ? "bg-white/[0.1] text-amber-100 ring-1 ring-amber-500/30"
              : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
          }`}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/learn?category=${encodeURIComponent(category)}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              activeCategory === category
                ? "bg-white/[0.1] text-amber-100 ring-1 ring-amber-500/30"
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
            }`}
          >
            {category}
          </Link>
        ))}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCourses.map((c) => (
          <li key={c.videoId}>
            <Link
              href={`/learn/courses/${c.videoId}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.55)] shadow-xl shadow-black/20 backdrop-blur-md transition hover:border-amber-500/25 hover:bg-[rgb(15_23_42_/0.72)]"
            >
              <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.06] bg-black/40">
                {c.thumbnailUrl ? (
                  <Image
                    src={c.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No thumbnail</div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="mb-2 w-fit rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/90">
                  {c.category}
                </span>
                <h2 className="mb-2 text-lg font-semibold tracking-tight text-white group-hover:text-amber-100">
                  {c.title}
                </h2>
                {c.summary ? <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">{c.summary}</p> : null}
                <span className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-amber-500/90">
                  Open course →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
