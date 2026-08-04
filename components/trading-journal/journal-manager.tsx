"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpenText, Pencil, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import type {
  TradeInstrumentType,
  TradeJournalEntry,
  TradeJournalFilters,
  TradeJournalListResponse,
  TradeSide,
  TradeStatus,
} from "@/types/trading-journal";

type FormState = {
  tradeDate: string;
  exitDate: string;
  symbol: string;
  instrumentType: TradeInstrumentType;
  side: TradeSide;
  quantity: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  targetPrice: string;
  fees: string;
  broker: string;
  setupTag: string;
  entryReason: string;
  exitReason: string;
  mistakes: string;
  lessons: string;
  status: TradeStatus;
};

const EMPTY_FORM: FormState = {
  tradeDate: "",
  exitDate: "",
  symbol: "",
  instrumentType: "equity",
  side: "long",
  quantity: "",
  entryPrice: "",
  exitPrice: "",
  stopLoss: "",
  targetPrice: "",
  fees: "",
  broker: "",
  setupTag: "",
  entryReason: "",
  exitReason: "",
  mistakes: "",
  lessons: "",
  status: "open",
};

function toFormState(entry: TradeJournalEntry): FormState {
  return {
    tradeDate: entry.tradeDate,
    exitDate: entry.exitDate ?? "",
    symbol: entry.symbol,
    instrumentType: entry.instrumentType,
    side: entry.side,
    quantity: String(entry.quantity),
    entryPrice: String(entry.entryPrice),
    exitPrice: entry.exitPrice == null ? "" : String(entry.exitPrice),
    stopLoss: entry.stopLoss == null ? "" : String(entry.stopLoss),
    targetPrice: entry.targetPrice == null ? "" : String(entry.targetPrice),
    fees: entry.fees == null ? "" : String(entry.fees),
    broker: entry.broker ?? "",
    setupTag: entry.setupTag ?? "",
    entryReason: entry.entryReason ?? "",
    exitReason: entry.exitReason ?? "",
    mistakes: entry.mistakes ?? "",
    lessons: entry.lessons ?? "",
    status: entry.status,
  };
}

function buildPayload(form: FormState) {
  return {
    tradeDate: form.tradeDate,
    exitDate: form.exitDate || null,
    symbol: form.symbol,
    instrumentType: form.instrumentType,
    side: form.side,
    quantity: Number(form.quantity),
    entryPrice: Number(form.entryPrice),
    exitPrice: form.exitPrice ? Number(form.exitPrice) : null,
    stopLoss: form.stopLoss ? Number(form.stopLoss) : null,
    targetPrice: form.targetPrice ? Number(form.targetPrice) : null,
    fees: form.fees ? Number(form.fees) : null,
    broker: form.broker || null,
    setupTag: form.setupTag || null,
    entryReason: form.entryReason || null,
    exitReason: form.exitReason || null,
    mistakes: form.mistakes || null,
    lessons: form.lessons || null,
    status: form.status,
  };
}

function toCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function toPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}%`;
}

export function JournalManager() {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [availableSetupTags, setAvailableSetupTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<TradeJournalFilters>({
    status: "all",
    instrumentType: "all",
    setupTag: "",
    search: "",
  });
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEntries(nextFilters: TradeJournalFilters) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (nextFilters.status && nextFilters.status !== "all") qs.set("status", nextFilters.status);
      if (nextFilters.instrumentType && nextFilters.instrumentType !== "all") {
        qs.set("instrumentType", nextFilters.instrumentType);
      }
      if (nextFilters.setupTag) qs.set("setupTag", nextFilters.setupTag);
      if (nextFilters.search) qs.set("search", nextFilters.search);

      const response = await fetch(`/api/journal${qs.size ? `?${qs}` : ""}`, { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as TradeJournalListResponse & { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "We couldn’t load your trading journal.");
      }
      setEntries(body.entries);
      setAvailableSetupTags(body.availableSetupTags);
      setSelectedEntryId((current) => {
        if (!body.entries.length) return null;
        if (current && body.entries.some((entry) => entry.id === current)) return current;
        return body.entries[0].id;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t load your trading journal.");
      setEntries([]);
      setAvailableSetupTags([]);
      setSelectedEntryId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEntries(filters);
  }, [filters]);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("prefill") !== "1") return;

    const instrumentTypeRaw = searchParams.get("instrumentType");
    const instrumentType: TradeInstrumentType =
      instrumentTypeRaw === "futures" || instrumentTypeRaw === "options" || instrumentTypeRaw === "equity"
        ? instrumentTypeRaw
        : "equity";
    const sideRaw = searchParams.get("side");
    const side: TradeSide = sideRaw === "short" ? "short" : "long";

    setEditingId(null);
    setFormState({
      ...EMPTY_FORM,
      tradeDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
      symbol: (searchParams.get("symbol") ?? "").toUpperCase(),
      instrumentType,
      side,
      quantity: searchParams.get("quantity") ?? "",
      entryPrice: searchParams.get("entryPrice") ?? "",
      stopLoss: searchParams.get("stopLoss") ?? "",
      targetPrice: searchParams.get("targetPrice") ?? "",
      status: "open",
    });
    setShowForm(true);
    setError(null);
  }, [searchParams]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  const stats = useMemo(() => {
    const closedWithPnl = entries.filter((entry) => entry.status === "closed" && entry.netPnl != null);
    const wins = closedWithPnl.filter((entry) => (entry.netPnl ?? 0) > 0).length;
    return {
      total: entries.length,
      open: entries.filter((entry) => entry.status === "open").length,
      closed: entries.filter((entry) => entry.status === "closed").length,
      totalNetPnl: entries.reduce((sum, entry) => sum + (entry.netPnl ?? 0), 0),
      winRate: closedWithPnl.length > 0 ? (wins / closedWithPnl.length) * 100 : null,
    };
  }, [entries]);

  function openCreateForm() {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(entry: TradeJournalEntry) {
    setEditingId(entry.id);
    setFormState(toFormState(entry));
    setShowForm(true);
    setError(null);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(editingId ? `/api/journal/${editingId}` : "/api/journal", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(formState)),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; entry?: TradeJournalEntry };
      if (!response.ok) {
        throw new Error(body.error ?? "We couldn’t save your trade.");
      }
      setShowForm(false);
      setEditingId(null);
      setFormState(EMPTY_FORM);
      await loadEntries(filters);
      if (body.entry?.id) {
        setSelectedEntryId(body.entry.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t save your trade.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entryId: string) {
    const confirmed = window.confirm("Delete this trade from your journal?");
    if (!confirmed) return;
    setError(null);
    try {
      const response = await fetch(`/api/journal/${entryId}`, { method: "DELETE" });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "We couldn’t delete your trade.");
      }
      if (selectedEntryId === entryId) {
        setSelectedEntryId(null);
      }
      await loadEntries(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t delete your trade.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 shadow-xl shadow-black/20 backdrop-blur-md md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-500/90">
              Trade Review Workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Trading Journal</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-[15px]">
              Capture entries, exits, mistakes, and lessons in one place so your process compounds along with your P&amp;L.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Trade
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total trades", value: stats.total },
          { label: "Open", value: stats.open },
          { label: "Closed", value: stats.closed },
          { label: "Total net P&L", value: toCurrency(stats.totalNetPnl) },
          { label: "Win rate", value: stats.winRate == null ? "—" : toPercent(stats.winRate) },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.48)] p-4 shadow-lg shadow-black/10"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[rgb(15_23_42_/0.52)] p-5 backdrop-blur-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-slate-300">
              <Search className="h-4 w-4 text-slate-500" aria-hidden />
              <input
                value={filters.search ?? ""}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search symbol"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
          </label>

          <FilterSelect
            label="Status"
            value={filters.status ?? "all"}
            options={[
              { value: "all", label: "All statuses" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, status: value as TradeJournalFilters["status"] }))}
          />

          <FilterSelect
            label="Instrument"
            value={filters.instrumentType ?? "all"}
            options={[
              { value: "all", label: "All instruments" },
              { value: "equity", label: "Equity" },
              { value: "futures", label: "Futures" },
              { value: "options", label: "Options" },
            ]}
            onChange={(value) =>
              setFilters((current) => ({ ...current, instrumentType: value as TradeJournalFilters["instrumentType"] }))
            }
          />

          <FilterSelect
            label="Setup Tag"
            value={filters.setupTag ?? ""}
            options={[
              { value: "", label: "All setup tags" },
              ...availableSetupTags.map((tag) => ({ value: tag, label: tag })),
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, setupTag: value }))}
          />
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-500/35 bg-rose-950/40 px-5 py-4 text-sm text-rose-100 shadow-lg shadow-rose-900/20">
          {error}
        </section>
      ) : null}

      {showForm ? (
        <section className="rounded-3xl border border-amber-500/20 bg-[rgb(15_23_42_/0.72)] p-5 shadow-2xl shadow-black/25 backdrop-blur-md md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/90">
                {editingId ? "Edit Trade" : "New Trade"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {editingId ? "Update your journal entry" : "Add a fresh trade review"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-xl border border-white/[0.08] px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
            >
              Close
            </button>
          </div>

          <form onSubmit={submitForm} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField label="Trade Date" type="date" value={formState.tradeDate} onChange={(value) => updateForm("tradeDate", value)} required />
              <TextField label="Exit Date" type="date" value={formState.exitDate} onChange={(value) => updateForm("exitDate", value)} />
              <TextField label="Symbol" value={formState.symbol} onChange={(value) => updateForm("symbol", value.toUpperCase())} required />
              <FilterSelect
                label="Status"
                value={formState.status}
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                ]}
                onChange={(value) => updateForm("status", value as TradeStatus)}
              />
              <FilterSelect
                label="Instrument"
                value={formState.instrumentType}
                options={[
                  { value: "equity", label: "Equity" },
                  { value: "futures", label: "Futures" },
                  { value: "options", label: "Options" },
                ]}
                onChange={(value) => updateForm("instrumentType", value as TradeInstrumentType)}
              />
              <FilterSelect
                label="Side"
                value={formState.side}
                options={[
                  { value: "long", label: "Long" },
                  { value: "short", label: "Short" },
                ]}
                onChange={(value) => updateForm("side", value as TradeSide)}
              />
              <TextField label="Quantity" type="number" step="0.0001" value={formState.quantity} onChange={(value) => updateForm("quantity", value)} required />
              <TextField label="Entry Price" type="number" step="0.0001" value={formState.entryPrice} onChange={(value) => updateForm("entryPrice", value)} required />
              <TextField label="Exit Price" type="number" step="0.0001" value={formState.exitPrice} onChange={(value) => updateForm("exitPrice", value)} />
              <TextField label="Stop Loss" type="number" step="0.0001" value={formState.stopLoss} onChange={(value) => updateForm("stopLoss", value)} />
              <TextField label="Target Price" type="number" step="0.0001" value={formState.targetPrice} onChange={(value) => updateForm("targetPrice", value)} />
              <TextField label="Fees" type="number" step="0.0001" value={formState.fees} onChange={(value) => updateForm("fees", value)} />
              <TextField label="Broker" value={formState.broker} onChange={(value) => updateForm("broker", value)} />
              <TextField label="Setup Tag" value={formState.setupTag} onChange={(value) => updateForm("setupTag", value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextAreaField label="Entry Reason" value={formState.entryReason} onChange={(value) => updateForm("entryReason", value)} />
              <TextAreaField label="Exit Reason" value={formState.exitReason} onChange={(value) => updateForm("exitReason", value)} />
              <TextAreaField label="Mistakes" value={formState.mistakes} onChange={(value) => updateForm("mistakes", value)} />
              <TextAreaField label="Lessons" value={formState.lessons} onChange={(value) => updateForm("lessons", value)} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update Trade" : "Save Trade"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormState(EMPTY_FORM);
                  setEditingId(null);
                }}
                className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-slate-100"
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 shadow-xl shadow-black/15 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Journal Entries</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Recent trades</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs text-slate-400">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" aria-hidden />
              Sorted by latest trade date
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-8 text-sm text-slate-400">
              Loading your journal…
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.12] bg-black/20 px-5 py-10 text-center">
              <BookOpenText className="mx-auto h-10 w-10 text-slate-500" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-white">No trades logged yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Start with your first trade entry so Twickers can become your review loop, not just your market prep tool.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-105"
              >
                Add your first trade
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400">
                    <th className="px-2 py-3 font-medium">Trade</th>
                    <th className="px-2 py-3 font-medium">Setup</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                    <th className="px-2 py-3 font-medium">Net P&amp;L</th>
                    <th className="px-2 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const active = entry.id === selectedEntryId;
                    const pnlPositive = (entry.netPnl ?? 0) > 0;
                    const pnlNegative = (entry.netPnl ?? 0) < 0;
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-white/[0.06] transition ${
                          active ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedEntryId(entry.id)}
                            className="text-left"
                          >
                            <p className="font-semibold text-white">{entry.symbol}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {entry.tradeDate} · {entry.side} · {entry.instrumentType}
                            </p>
                          </button>
                        </td>
                        <td className="px-2 py-3 text-slate-300">{entry.setupTag ?? "—"}</td>
                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              entry.status === "closed"
                                ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/20"
                                : "bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-400/20"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                        <td
                          className={`px-2 py-3 font-medium ${
                            pnlPositive ? "text-emerald-300" : pnlNegative ? "text-rose-300" : "text-slate-300"
                          }`}
                        >
                          {toCurrency(entry.netPnl)}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(entry)}
                              className="rounded-lg border border-white/[0.08] p-2 text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                              aria-label={`Edit ${entry.symbol}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteEntry(entry.id)}
                              className="rounded-lg border border-rose-500/25 p-2 text-rose-200 transition hover:bg-rose-500/10"
                              aria-label={`Delete ${entry.symbol}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-white/[0.08] bg-[rgb(15_23_42_/0.56)] p-5 shadow-xl shadow-black/15 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Trade Detail</p>
          {selectedEntry ? (
            <div className="mt-4 space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">{selectedEntry.symbol}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedEntry.instrumentType} · {selectedEntry.side} · {selectedEntry.status}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailCard label="Trade Date" value={selectedEntry.tradeDate} />
                <DetailCard label="Exit Date" value={selectedEntry.exitDate ?? "—"} />
                <DetailCard label="Quantity" value={selectedEntry.quantity.toString()} />
                <DetailCard label="Holding Days" value={selectedEntry.holdingDays.toString()} />
                <DetailCard label="Entry Price" value={selectedEntry.entryPrice.toString()} />
                <DetailCard label="Exit Price" value={selectedEntry.exitPrice?.toString() ?? "—"} />
                <DetailCard label="Gross P&L" value={toCurrency(selectedEntry.grossPnl)} />
                <DetailCard label="Net P&L" value={toCurrency(selectedEntry.netPnl)} />
                <DetailCard label="P&L %" value={toPercent(selectedEntry.pnlPercent)} />
                <DetailCard label="Fees" value={toCurrency(selectedEntry.fees)} />
                <DetailCard label="Broker" value={selectedEntry.broker ?? "—"} />
                <DetailCard label="Setup Tag" value={selectedEntry.setupTag ?? "—"} />
              </div>

              <LongTextCard title="Entry Reason" body={selectedEntry.entryReason} />
              <LongTextCard title="Exit Reason" body={selectedEntry.exitReason} />
              <LongTextCard title="Mistakes" body={selectedEntry.mistakes} />
              <LongTextCard title="Lessons" body={selectedEntry.lessons} />
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/[0.12] bg-black/20 px-5 py-8 text-sm text-slate-400">
              Select a trade to review the full journal detail.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-amber-500/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  step,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        type={type}
        step={step}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-500/40"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <textarea
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-500/40"
      />
    </label>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function LongTextCard({ title, body }: { title: string; body: string | null }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{body || "No notes recorded."}</p>
    </section>
  );
}
