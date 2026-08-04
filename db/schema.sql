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

-- ------------------------------
-- Auth + Billing (Google + Credentials + Razorpay)
-- ------------------------------

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'oauth',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS auth_accounts_user_idx ON auth_accounts (user_id);

CREATE TABLE IF NOT EXISTS user_credentials (
  user_id UUID PRIMARY KEY REFERENCES app_users (id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  tier_rank INT NOT NULL DEFAULT 1,
  amount_paise INT NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  billing_type TEXT NOT NULL CHECK (billing_type IN ('recurring', 'one_time')),
  interval_unit TEXT CHECK (interval_unit IN ('day', 'week', 'month', 'year')),
  interval_count INT CHECK (interval_count IS NULL OR interval_count >= 1),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_plans_active_idx ON billing_plans (active, tier_rank);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES billing_plans (id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (
    status IN ('created', 'trialing', 'active', 'past_due', 'cancelled', 'expired')
  ),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx
  ON subscriptions (user_id, status, current_period_end DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  plan_id UUID REFERENCES billing_plans (id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions (id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  provider_invoice_id TEXT,
  amount_paise INT NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  payment_method TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_order_id),
  UNIQUE (provider, provider_payment_id)
);

CREATE INDEX IF NOT EXISTS payments_user_created_idx ON payments (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

-- ------------------------------
-- Trading Journal
-- ------------------------------

CREATE TABLE IF NOT EXISTS trade_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  exit_date DATE,
  symbol TEXT NOT NULL,
  instrument_type TEXT NOT NULL CHECK (instrument_type IN ('equity', 'futures', 'options')),
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  quantity NUMERIC(18, 4) NOT NULL CHECK (quantity > 0),
  entry_price NUMERIC(18, 4) NOT NULL CHECK (entry_price > 0),
  exit_price NUMERIC(18, 4) CHECK (exit_price IS NULL OR exit_price > 0),
  stop_loss NUMERIC(18, 4) CHECK (stop_loss IS NULL OR stop_loss > 0),
  target_price NUMERIC(18, 4) CHECK (target_price IS NULL OR target_price > 0),
  fees NUMERIC(18, 4) CHECK (fees IS NULL OR fees >= 0),
  broker TEXT,
  setup_tag TEXT,
  entry_reason TEXT,
  exit_reason TEXT,
  mistakes TEXT,
  lessons TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (exit_date IS NULL OR exit_date >= trade_date),
  CHECK (
    (status = 'open' AND exit_price IS NULL)
    OR (status = 'closed' AND exit_price IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS trade_journal_entries_user_trade_date_idx
  ON trade_journal_entries (user_id, trade_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS trade_journal_entries_user_status_trade_date_idx
  ON trade_journal_entries (user_id, status, trade_date DESC, created_at DESC);

-- ------------------------------
-- User Risk Profiles (Position Sizing Calculator)
-- ------------------------------

CREATE TABLE IF NOT EXISTS user_risk_profiles (
  user_id UUID PRIMARY KEY REFERENCES app_users (id) ON DELETE CASCADE,
  capital NUMERIC(18, 2) NOT NULL CHECK (capital > 0),
  default_risk_percent NUMERIC(6, 3) NOT NULL DEFAULT 2 CHECK (default_risk_percent > 0 AND default_risk_percent <= 100),
  default_concurrent_positions INT NOT NULL DEFAULT 1 CHECK (default_concurrent_positions >= 1 AND default_concurrent_positions <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
