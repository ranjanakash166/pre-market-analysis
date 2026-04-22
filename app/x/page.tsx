"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MessageCircle, Radio, Sparkles } from "lucide-react";
import { pageTitle } from "@/lib/branding";
import type { MonitoredAccountPublic, TweetPublic, XFeedAnalysisPublic } from "@/lib/x-types";

type AccountsResponse = { ok: boolean; accounts: MonitoredAccountPublic[]; error?: string };
type TweetsResponse = {
  ok: boolean;
  account: { id: string; handle: string; displayName: string | null };
  tweets: TweetPublic[];
  nextCursor: string | null;
  error?: string;
};
type AnalysisResponse = { ok: boolean; analysis: XFeedAnalysisPublic | null; error?: string };

function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export default function XFeedPage() {
  useDocumentTitle(pageTitle("X feed intel"));

  const [accounts, setAccounts] = useState<MonitoredAccountPublic[] | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tweets, setTweets] = useState<TweetPublic[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<XFeedAnalysisPublic | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTweets, setLoadingTweets] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadAccounts() {
      setLoadingAccounts(true);
      setDbError(null);
      try {
        const res = await fetch("/api/x/accounts", { cache: "no-store" });
        const body = (await res.json()) as AccountsResponse;
        if (!res.ok || !body.ok) {
          if (!cancelled) setDbError(body.error ?? "Could not load accounts.");
          return;
        }
        if (!cancelled) {
          setAccounts(body.accounts);
          setSelectedId((prev) => prev ?? (body.accounts[0]?.id ?? null));
        }
      } catch {
        if (!cancelled) setDbError("Network error loading accounts.");
      } finally {
        if (!cancelled) setLoadingAccounts(false);
      }
    }
    void loadAccounts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    async function loadTweets() {
      setLoadingTweets(true);
      try {
        const res = await fetch(`/api/x/accounts/${selectedId}/tweets?limit=25`, { cache: "no-store" });
        const body = (await res.json()) as TweetsResponse;
        if (!cancelled && res.ok && body.ok) {
          setTweets(body.tweets);
          setNextCursor(body.nextCursor);
        }
      } finally {
        if (!cancelled) setLoadingTweets(false);
      }
    }

    async function loadAnalysis() {
      setLoadingAnalysis(true);
      try {
        const res = await fetch(`/api/x/accounts/${selectedId}/analysis/latest`, { cache: "no-store" });
        const body = (await res.json()) as AnalysisResponse;
        if (!cancelled && res.ok && body.ok) {
          setAnalysis(body.analysis ?? null);
        }
      } finally {
        if (!cancelled) setLoadingAnalysis(false);
      }
    }

    void loadTweets();
    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function loadMore() {
    if (!selectedId || !nextCursor) return;
    setLoadingTweets(true);
    try {
      const qs = new URLSearchParams({ limit: "25", cursor: nextCursor });
      const res = await fetch(`/api/x/accounts/${selectedId}/tweets?${qs}`, { cache: "no-store" });
      const body = (await res.json()) as TweetsResponse;
      if (res.ok && body.ok) {
        setTweets((prev) => [...prev, ...body.tweets]);
        setNextCursor(body.nextCursor);
      }
    } finally {
      setLoadingTweets(false);
    }
  }

  const selected = accounts?.find((a) => a.id === selectedId) ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <header className="mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 ring-1 ring-white/10">
          <Radio className="h-3.5 w-3.5 text-amber-400" aria-hidden />
          Curated X intel
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Market signals from monitored accounts
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
          Ingestion runs on a schedule; this page reads the latest cached posts and AI commentary from your database —
          not the live X API on every page load.
        </p>
      </header>

      {dbError ? (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-6 text-sm text-amber-100 ring-1 ring-amber-500/20">
          <p className="font-medium">Database not ready</p>
          <p className="mt-2 text-amber-100/80">{dbError}</p>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr]">
        <aside className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Accounts</h2>
          <div className="space-y-2">
            {loadingAccounts ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : accounts && accounts.length === 0 ? (
              <p className="text-sm text-slate-400">
                No rows in <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-200">monitored_accounts</code>.
                Set <code className="rounded bg-white/5 px-1.5 py-0.5">X_MONITOR_HANDLES</code> and run the sync cron.
              </p>
            ) : (
              accounts?.map((a) => {
                const active = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`flex w-full flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-amber-500/40 bg-amber-500/[0.07] ring-1 ring-amber-500/30"
                        : "border-white/10 bg-white/[0.03] hover:border-white/15"
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">@{a.handle}</span>
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">{a.status}</span>
                    {a.lastError ? (
                      <span className="text-xs text-rose-300/90">Last error: {a.lastError}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 ring-1 ring-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <Sparkles className="h-4 w-4 text-amber-400" aria-hidden />
                  AI synthesis
                </h2>
                {selected ? (
                  <p className="mt-1 text-xs text-slate-500">
                    @{selected.handle} · latest batch analysis
                    {analysis?.model ? ` · ${analysis.model}` : ""}
                  </p>
                ) : null}
              </div>
              {loadingAnalysis ? <span className="text-xs text-slate-500">Updating…</span> : null}
            </div>

            {!analysis ? (
              <p className="mt-4 text-sm text-slate-400">
                {selected
                  ? "No analysis yet. After new posts are ingested, the sync job will generate a structured summary."
                  : "Select an account."}
              </p>
            ) : (
              <AnalysisPanel analysis={analysis} />
            )}
          </div>

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              <MessageCircle className="h-4 w-4 text-slate-300" aria-hidden />
              Cached posts
            </h2>

            {loadingTweets && tweets.length === 0 ? (
              <p className="text-sm text-slate-500">Loading posts…</p>
            ) : tweets.length === 0 ? (
              <p className="text-sm text-slate-400">No tweets stored yet for this account.</p>
            ) : (
              <ul className="space-y-4">
                {tweets.map((t) => (
                  <li
                    key={t.tweetId}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <time dateTime={t.createdAt}>{new Date(t.createdAt).toLocaleString()}</time>
                      <a
                        href={t.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-amber-300/90 hover:text-amber-200"
                      >
                        Open on X
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{t.text}</p>
                    {t.media.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {t.media.map((m, i) => (
                          <li key={`${t.tweetId}-m-${i}`} className="text-xs text-slate-500">
                            {m.type}
                            {m.url ? (
                              <>
                                {": "}
                                <a href={m.url} className="text-amber-300/90 hover:underline" target="_blank" rel="noreferrer">
                                  link
                                </a>
                              </>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {nextCursor ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingTweets}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/25 disabled:opacity-60"
                >
                  {loadingTweets ? "Loading…" : "Load older"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object";
}

function AnalysisPanel({ analysis }: { analysis: XFeedAnalysisPublic }) {
  const p = analysis.payload;

  if (isRecord(p) && typeof p.summary === "string") {
    const sentiment = typeof p.sentiment === "string" ? p.sentiment : "neutral";
    const themes = Array.isArray(p.themes) ? p.themes.filter((x) => typeof x === "string") : [];
    const risks = Array.isArray(p.risks) ? p.risks.filter((x) => typeof x === "string") : [];
    const ideas = Array.isArray(p.tradingIdeas)
      ? p.tradingIdeas.filter((x) => typeof x === "string")
      : [];

    return (
      <div className="mt-5 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-semibold uppercase tracking-wide text-slate-200 ring-1 ring-white/10">
            Sentiment · {sentiment.replace("_", " ")}
          </span>
          <span>Schema v{analysis.schemaVersion}</span>
          <span>{new Date(analysis.createdAt).toLocaleString()}</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-100">{p.summary}</p>

        <div className="grid gap-6 md:grid-cols-3">
          <BulletList title="Themes" items={themes} />
          <BulletList title="Risks" items={risks} />
          <BulletList title="Ideas (hypotheses)" items={ideas} />
        </div>

        {analysis.citedTweetIds.length > 0 ? (
          <p className="text-[11px] text-slate-500">
            Cited tweet ids: {analysis.citedTweetIds.slice(0, 12).join(", ")}
            {analysis.citedTweetIds.length > 12 ? "…" : ""}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/40 p-4 text-xs text-slate-200 ring-1 ring-white/10">
      {JSON.stringify(p, null, 2)}
    </pre>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-200 marker:text-slate-600">
        {items.length === 0 ? <li className="text-slate-500">None noted.</li> : null}
        {items.map((item, i) => (
          <li key={`${i}-${item.slice(0, 40)}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
