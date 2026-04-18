export type TraderMode = "A" | "B" | "C";

export type SentimentTone = "positive" | "negative" | "neutral";

export interface SourceLink {
  name: string;
  url: string;
}

export interface Metric {
  label: string;
  value: string;
  freshness: string;
  change?: string;
  tone: SentimentTone;
  note?: string;
  source: SourceLink;
}

export interface NewsItem {
  tag: string;
  happened: string;
  impact: string;
  publishedAt: string;
  source: SourceLink;
}

export interface ReportSection {
  id: string;
  title: string;
  summary?: string;
  metrics: Metric[];
  bullets: string[];
  news?: NewsItem[];
}

export interface GeneratedReport {
  mode: TraderMode;
  generatedAt: string;
  promptTimeIst: string;
  sourcesUsed: SourceLink[];
  sections: ReportSection[];
  verdict: {
    title: string;
    bias: "bullish" | "bearish" | "neutral";
    confidence: "High" | "Medium" | "Low";
    bullets: string[];
  };
  disclaimer: string[];
}

export interface StoredReport {
  report: GeneratedReport;
  updatedAt: string;
}
