-- Twickers — X feed ingestion & analysis. Apply to Neon, Supabase, RDS, or local Postgres.
-- gen_random_uuid() requires pgcrypto (Neon/Supabase include it).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS monitored_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  x_user_id TEXT,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  poll_interval_seconds INT NOT NULL DEFAULT 900 CHECK (poll_interval_seconds >= 60),
  priority INT NOT NULL DEFAULT 0,
  last_fetch_at TIMESTAMPTZ,
  last_seen_tweet_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitored_accounts_active_poll
  ON monitored_accounts (status, last_fetch_at);

CREATE TABLE IF NOT EXISTS tweets (
  tweet_id TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES monitored_accounts (id) ON DELETE CASCADE,
  author_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  lang TEXT,
  possibly_sensitive BOOLEAN,
  conversation_id TEXT,
  json_raw JSONB NOT NULL DEFAULT '{}',
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tweets_account_created ON tweets (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tweet_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id TEXT NOT NULL REFERENCES tweets (tweet_id) ON DELETE CASCADE,
  media_key TEXT,
  type TEXT,
  url TEXT,
  preview_image_url TEXT,
  width INT,
  height INT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS tweet_media_tweet ON tweet_media (tweet_id);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES monitored_accounts (id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  new_tweets_count INT NOT NULL DEFAULT 0,
  http_status INT,
  error TEXT,
  cursor_debug JSONB
);

CREATE INDEX IF NOT EXISTS ingestion_runs_account ON ingestion_runs (account_id, started_at DESC);

CREATE TABLE IF NOT EXISTS analysis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  prompt_version TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  model TEXT,
  config JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES analysis_templates (id) ON DELETE SET NULL,
  scope TEXT NOT NULL CHECK (scope IN ('batch', 'tweet')),
  input_ref JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  model TEXT,
  token_usage JSONB
);

CREATE INDEX IF NOT EXISTS analysis_runs_template ON analysis_runs (template_id, started_at DESC);

CREATE TABLE IF NOT EXISTS analysis_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES analysis_runs (id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES monitored_accounts (id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  payload_schema_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analysis_outputs_account_created
  ON analysis_outputs (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS analysis_tweet_links (
  analysis_output_id UUID NOT NULL REFERENCES analysis_outputs (id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL REFERENCES tweets (tweet_id) ON DELETE CASCADE,
  PRIMARY KEY (analysis_output_id, tweet_id)
);
