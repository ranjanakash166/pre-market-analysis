import { cn } from "@/lib/utils";
import type { SentimentTone } from "@/types/report";

interface StatusBadgeProps {
  tone: SentimentTone;
  label: string;
}

const styles: Record<SentimentTone, string> = {
  positive: "border-emerald-400/35 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/10",
  negative: "border-rose-400/35 bg-rose-500/15 text-rose-300 shadow-sm shadow-rose-500/10",
  neutral: "border-amber-400/35 bg-amber-500/12 text-amber-200 shadow-sm shadow-amber-500/10",
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-100",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}
