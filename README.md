# Pre-Market Analysis App

Next.js app that generates A/B/C India pre-market reports using frontier AI models.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `AI_API_KEY` with your provider API key (`GEMINI_API_KEY` is still accepted as a legacy alias).
3. Optionally set `AI_MODEL` for the generation model id (`GEMINI_MODEL` still works).
4. Run:

```bash
npm install
npm run dev
```

## Endpoints

- `GET /api/report?mode=A|B|C` - fetch latest cached report
- `POST /api/generate` - generate report manually (`{ "mode": "A" }`)
- `POST /api/cron/generate` - generate all modes (requires `x-cron-token`)
