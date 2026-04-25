import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, PlayCircle } from "lucide-react";
import { loadCourse, loadCourseCatalog } from "@/lib/courses-data";
import { pageTitle } from "@/lib/branding";

type PageProps = { params: Promise<{ videoId: string }> };

export async function generateStaticParams(): Promise<{ videoId: string }[]> {
  const catalog = await loadCourseCatalog();
  return catalog.courses.map((c) => ({ videoId: c.videoId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { videoId } = await params;
  try {
    const course = await loadCourse(videoId);
    return {
      title: pageTitle(course.title),
      description: course.summary,
    };
  } catch {
    return { title: pageTitle("Course") };
  }
}

export default async function CoursePage({ params }: PageProps) {
  const { videoId } = await params;
  let course;
  try {
    course = await loadCourse(videoId);
  } catch {
    notFound();
  }

  const embedSrc = `https://www.youtube-nocookie.com/embed/${course.videoId}?rel=0`;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8 md:pt-10">
      <Link
        href="/learn"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-amber-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All courses
      </Link>

      <header className="mb-10 max-w-3xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-500/90">Course</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">{course.title}</h1>
        {course.subtitle ? <p className="mb-3 text-base text-slate-300">{course.subtitle}</p> : null}
        <p className="text-sm leading-relaxed text-slate-400 md:text-[15px]">{course.summary}</p>
        {course.estimatedMinutes ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            About {course.estimatedMinutes} min video · self-paced notes
          </p>
        ) : null}
        <p className="mt-4 text-sm">
          <a
            href={course.sourceVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-cyan-400/95 underline decoration-cyan-500/40 underline-offset-4 transition hover:text-cyan-300"
          >
            Open on YouTube
          </a>
        </p>
      </header>

      <div className="mb-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-2xl shadow-black/30 ring-1 ring-white/[0.04]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <PlayCircle className="h-4 w-4 text-amber-500/90" aria-hidden />
          Watch
        </div>
        <div className="aspect-video w-full">
          <iframe
            title={`YouTube: ${course.title}`}
            src={embedSrc}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-12">
        <aside className="mb-10 lg:mb-0">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            <ListChecks className="h-4 w-4 text-amber-500/80" aria-hidden />
            Modules
          </p>
          <nav className="sticky top-24 space-y-1 text-sm">
            {course.modules.map((m) => (
              <a
                key={m.id}
                href={`#${m.id}`}
                className="block rounded-lg px-3 py-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-100"
              >
                {m.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-12">
          <section className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-6 backdrop-blur-sm md:p-7">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Learning objectives</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
              {course.learningObjectives.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/90" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </section>

          {course.modules.map((m) => (
            <section key={m.id} id={m.id} className="scroll-mt-28">
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">{m.title}</h2>
              {m.summary ? <p className="mb-4 text-sm text-slate-400">{m.summary}</p> : null}
              <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                {m.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {m.anchors?.length ? (
                <ul className="mt-4 space-y-1 text-xs text-slate-500">
                  {m.anchors.map((a) => (
                    <li key={`${a.label}-${a.seconds}`}>
                      <a
                        href={`${course.sourceVideoUrl}&t=${Math.floor(a.seconds)}s`}
                        className="text-cyan-400/90 underline decoration-cyan-500/35 underline-offset-2 hover:text-cyan-300"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {a.label}
                      </a>{" "}
                      (~{Math.floor(a.seconds / 60)}:{String(Math.floor(a.seconds % 60)).padStart(2, "0")})
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.5)] p-6 backdrop-blur-sm md:p-7">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Key takeaways</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
              {course.keyTakeaways.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-dashed border-white/[0.1] bg-black/20 px-5 py-4 text-xs leading-relaxed text-slate-500 md:px-6">
            {course.disclaimer.map((line) => (
              <p key={line} className="mb-2 last:mb-0">
                {line}
              </p>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
