# Twickers

**Twickers** is a markets clarity product. This repository ships the first feature: an **India pre-market briefing** — A/B/C trader modes, AI-generated reports, live index enrichment, and cached reads.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `AI_API_KEY` with your provider API key (`GEMINI_API_KEY` is still accepted as a legacy alias).
3. Optionally set `AI_MODEL` for the generation model id (`GEMINI_MODEL` still works).
4. Run:

```bash
npm install
npm run dev
```

## Hosting on Vercel

Report JSON is stored on disk. On Vercel (`VERCEL=1`), files go under the server **temp** directory (writable), not under the project folder. That storage is **ephemeral**: it may disappear on cold starts or differ between instances. For durable, shared storage, use Vercel KV, Blob, Postgres, or similar later.

## Endpoints

- `GET /api/report?mode=A|B|C` - fetch latest cached report
- `POST /api/generate` - generate report manually (`{ "mode": "A" }`)
- `POST /api/cron/generate` - generate all modes (requires `x-cron-token`)
