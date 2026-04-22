import postgres from "postgres";
import { getSql } from "@/lib/db";
import type { MonitoredAccountPublic, TweetPublic, XFeedAnalysisPublic } from "@/lib/x-types";

type MonitoredAccountRow = {
  id: string;
  handle: string;
  display_name: string | null;
  status: string;
  poll_interval_seconds: number;
  last_fetch_at: Date | null;
  last_seen_tweet_id: string | null;
  last_error: string | null;
};

type DueAccountRow = {
  id: string;
  handle: string;
  x_user_id: string | null;
  poll_interval_seconds: number;
  last_seen_tweet_id: string | null;
};

type IdRow = { id: string };

type TweetSelectRow = {
  tweet_id: string;
  account_id: string;
  author_id: string | null;
  created_at: Date;
  text: string;
  lang: string | null;
  possibly_sensitive: boolean | null;
  conversation_id: string | null;
  json_raw: unknown;
};

type TweetMediaRow = {
  tweet_id: string;
  media_key: string | null;
  type: string | null;
  url: string | null;
  preview_image_url: string | null;
  width: number | null;
  height: number | null;
};

type AnalysisJoinedRow = {
  id: string;
  run_id: string;
  account_id: string;
  created_at: Date;
  payload: unknown;
  payload_schema_version: number;
  model: string | null;
  prompt_version: string | null;
  handle: string;
  tweet_ids: string[] | null;
};

type RecentTweetTextRow = { tweet_id: string; created_at: Date; text: string };

type TweetIdRow = { tweet_id: string };

export function hasDatabase(): boolean {
  return getSql() != null;
}

function requireSql(): NonNullable<ReturnType<typeof getSql>> {
  const sql = getSql();
  if (!sql) {
    throw new Error("POSTGRES_URL or DATABASE_URL is not configured");
  }
  return sql;
}

export async function seedMonitoredHandlesFromEnv(): Promise<{ inserted: number }> {
  const sql = getSql();
  if (!sql) return { inserted: 0 };

  const raw = process.env.X_MONITOR_HANDLES?.trim();
  if (!raw) return { inserted: 0 };

  const handles = raw
    .split(/[\s,]+/)
    .map((s) => s.replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean);

  let inserted = 0;
  for (const handle of handles) {
    const r = await sql`
      INSERT INTO monitored_accounts (handle)
      VALUES (${handle})
      ON CONFLICT (handle) DO NOTHING
      RETURNING id
    `;
    if (r.length > 0) inserted += 1;
  }
  return { inserted };
}

export async function listMonitoredAccounts(): Promise<MonitoredAccountPublic[]> {
  const sql = getSql();
  if (!sql) return [];

  const rows = (await sql`
    SELECT id, handle, display_name, status, poll_interval_seconds,
           last_fetch_at, last_seen_tweet_id, last_error
    FROM monitored_accounts
    ORDER BY priority DESC, handle ASC
  `) as MonitoredAccountRow[];

  return rows.map((r) => ({
    id: r.id,
    handle: r.handle,
    displayName: r.display_name,
    status: r.status,
    pollIntervalSeconds: r.poll_interval_seconds,
    lastFetchAt: r.last_fetch_at?.toISOString() ?? null,
    lastSeenTweetId: r.last_seen_tweet_id,
    lastError: r.last_error,
  }));
}

export async function getMonitoredAccountById(
  accountId: string,
): Promise<MonitoredAccountPublic | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = (await sql`
    SELECT id, handle, display_name, status, poll_interval_seconds,
           last_fetch_at, last_seen_tweet_id, last_error
    FROM monitored_accounts
    WHERE id = ${accountId}
    LIMIT 1
  `) as MonitoredAccountRow[];
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    handle: r.handle,
    displayName: r.display_name,
    status: r.status,
    pollIntervalSeconds: r.poll_interval_seconds,
    lastFetchAt: r.last_fetch_at?.toISOString() ?? null,
    lastSeenTweetId: r.last_seen_tweet_id,
    lastError: r.last_error,
  };
}

/**
 * Accounts that are active and whose poll window has elapsed (or never fetched).
 */
export async function selectAccountsDueForPoll(limit: number): Promise<DueAccountRow[]> {
  const sql = requireSql();
  return (await sql`
    SELECT id, handle, x_user_id, poll_interval_seconds, last_seen_tweet_id
    FROM monitored_accounts
    WHERE status = 'active'
      AND (
        last_fetch_at IS NULL
        OR last_fetch_at < now() - (poll_interval_seconds::text || ' seconds')::interval
      )
    ORDER BY last_fetch_at ASC NULLS FIRST
    LIMIT ${limit}
  `) as DueAccountRow[];
}

export async function updateAccountXUser(
  accountId: string,
  xUserId: string,
  displayName: string,
): Promise<void> {
  const sql = requireSql();
  await sql`
    UPDATE monitored_accounts
    SET x_user_id = ${xUserId},
        display_name = ${displayName},
        updated_at = now(),
        status = 'active',
        last_error = NULL
    WHERE id = ${accountId}
  `;
}

export async function updateAccountFetchSuccess(
  accountId: string,
  lastSeenTweetId: string | null,
): Promise<void> {
  const sql = requireSql();
  await sql`
    UPDATE monitored_accounts
    SET last_fetch_at = now(),
        last_seen_tweet_id = COALESCE(${lastSeenTweetId}, last_seen_tweet_id),
        updated_at = now(),
        last_error = NULL,
        status = 'active'
    WHERE id = ${accountId}
  `;
}

export async function updateAccountFetchError(accountId: string, message: string): Promise<void> {
  const sql = requireSql();
  await sql`
    UPDATE monitored_accounts
    SET last_fetch_at = now(),
        last_error = ${message},
        updated_at = now()
    WHERE id = ${accountId}
  `;
}

export async function startIngestionRun(accountId: string): Promise<string> {
  const sql = requireSql();
  const rows = (await sql`
    INSERT INTO ingestion_runs (account_id, status)
    VALUES (${accountId}, 'running')
    RETURNING id
  `) as IdRow[];
  return rows[0].id;
}

export async function finishIngestionRun(
  runId: string,
  patch: {
    status: string;
    newTweetsCount: number;
    httpStatus?: number;
    error?: string;
    cursorDebug?: unknown;
  },
): Promise<void> {
  const sql = requireSql();
  await sql`
    UPDATE ingestion_runs
    SET finished_at = now(),
        status = ${patch.status},
        new_tweets_count = ${patch.newTweetsCount},
        http_status = ${patch.httpStatus ?? null},
        error = ${patch.error ?? null},
        cursor_debug = ${patch.cursorDebug == null ? null : sql.json(JSON.parse(JSON.stringify(patch.cursorDebug)) as postgres.JSONValue)}
    WHERE id = ${runId}
  `;
}

export async function upsertTweetBundle(input: {
  accountId: string;
  tweet: {
    id: string;
    text: string;
    createdAt: string;
    authorId?: string;
    lang?: string;
    possiblySensitive?: boolean;
    conversationId?: string;
    jsonRaw: unknown;
  };
  media: {
    mediaKey: string | null;
    type: string | null;
    url: string | null;
    previewImageUrl: string | null;
    width: number | null;
    height: number | null;
    metadata: unknown;
  }[];
}): Promise<boolean> {
  const sql = requireSql();
  const jsonRaw = JSON.parse(
    JSON.stringify(
      input.tweet.jsonRaw && typeof input.tweet.jsonRaw === "object"
        ? input.tweet.jsonRaw
        : { value: input.tweet.jsonRaw },
    ),
  ) as postgres.JSONValue;

  const existing = (await sql`
    SELECT tweet_id FROM tweets WHERE tweet_id = ${input.tweet.id} LIMIT 1
  `) as TweetIdRow[];
  const isNew = existing.length === 0;

  await sql`
    INSERT INTO tweets (
      tweet_id, account_id, author_id, created_at, text, lang,
      possibly_sensitive, conversation_id, json_raw
    )
    VALUES (
      ${input.tweet.id},
      ${input.accountId},
      ${input.tweet.authorId ?? null},
      ${input.tweet.createdAt},
      ${input.tweet.text},
      ${input.tweet.lang ?? null},
      ${input.tweet.possiblySensitive ?? null},
      ${input.tweet.conversationId ?? null},
      ${sql.json(jsonRaw)}
    )
    ON CONFLICT (tweet_id) DO UPDATE SET
      text = EXCLUDED.text,
      json_raw = EXCLUDED.json_raw
  `;

  await sql`DELETE FROM tweet_media WHERE tweet_id = ${input.tweet.id}`;

  for (const m of input.media) {
    await sql`
      INSERT INTO tweet_media (
        tweet_id, media_key, type, url, preview_image_url, width, height, metadata
      )
      VALUES (
        ${input.tweet.id},
        ${m.mediaKey},
        ${m.type},
        ${m.url},
        ${m.previewImageUrl},
        ${m.width},
        ${m.height},
        ${sql.json(
          JSON.parse(
            JSON.stringify(
              m.metadata != null && typeof m.metadata === "object" ? m.metadata : {},
            ),
          ) as postgres.JSONValue,
        )}
      )
    `;
  }

  return isNew;
}

function permalink(handle: string, tweetId: string): string {
  return `https://x.com/${handle}/status/${tweetId}`;
}

export type TweetPageCursor = { createdAt: string; tweetId: string };

export function encodeTweetCursor(c: TweetPageCursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

export function decodeTweetCursor(raw: string | null): TweetPageCursor | null {
  if (!raw) return null;
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    if (!json || typeof json !== "object") return null;
    const o = json as Record<string, unknown>;
    if (typeof o.createdAt !== "string" || typeof o.tweetId !== "string") return null;
    return { createdAt: o.createdAt, tweetId: o.tweetId };
  } catch {
    return null;
  }
}

export async function listTweetsPage(input: {
  accountId: string;
  handle: string;
  limit: number;
  cursor: TweetPageCursor | null;
}): Promise<{ tweets: TweetPublic[]; nextCursor: string | null }> {
  const sql = requireSql();
  const lim = Math.min(Math.max(input.limit, 1), 50);

  const rows = (
    input.cursor
      ? await sql`
          SELECT tweet_id, account_id, author_id, created_at, text, lang,
                 possibly_sensitive, conversation_id, json_raw
          FROM tweets
          WHERE account_id = ${input.accountId}
            AND (created_at, tweet_id) < (${input.cursor.createdAt}::timestamptz, ${input.cursor.tweetId})
          ORDER BY created_at DESC, tweet_id DESC
          LIMIT ${lim + 1}
        `
      : await sql`
          SELECT tweet_id, account_id, author_id, created_at, text, lang,
                 possibly_sensitive, conversation_id, json_raw
          FROM tweets
          WHERE account_id = ${input.accountId}
          ORDER BY created_at DESC, tweet_id DESC
          LIMIT ${lim + 1}
        `
  ) as TweetSelectRow[];

  const slice = rows.slice(0, lim);
  const next =
    rows.length > lim && rows[lim]
      ? encodeTweetCursor({
          createdAt: rows[lim].created_at.toISOString(),
          tweetId: rows[lim].tweet_id,
        })
      : null;

  const ids = slice.map((t) => t.tweet_id);
  if (ids.length === 0) {
    return { tweets: [], nextCursor: next };
  }

  const mediaRows = (await sql`
    SELECT tweet_id, media_key, type, url, preview_image_url, width, height
    FROM tweet_media
    WHERE tweet_id = ANY(${sql.array(ids)}::text[])
  `) as TweetMediaRow[];

  const byTweet = new Map<string, TweetPublic["media"]>();
  for (const id of ids) byTweet.set(id, []);
  for (const m of mediaRows) {
    const arr = byTweet.get(m.tweet_id);
    if (!arr) continue;
    arr.push({
      mediaKey: m.media_key,
      type: m.type,
      url: m.url,
      previewImageUrl: m.preview_image_url,
      width: m.width,
      height: m.height,
    });
  }

  const tweets: TweetPublic[] = slice.map((t) => ({
    tweetId: t.tweet_id,
    accountId: t.account_id,
    handle: input.handle,
    createdAt: t.created_at.toISOString(),
    text: t.text,
    lang: t.lang,
    possiblySensitive: t.possibly_sensitive,
    conversationId: t.conversation_id,
    permalink: permalink(input.handle, t.tweet_id),
    media: byTweet.get(t.tweet_id) ?? [],
  }));

  return { tweets, nextCursor: next };
}

const TEMPLATE_KEY = "x_feed_market_batch";

export async function ensureAnalysisTemplate(): Promise<{ id: string }> {
  const sql = requireSql();
  const rows = (await sql`
    INSERT INTO analysis_templates (key, prompt_version, schema_version)
    VALUES (${TEMPLATE_KEY}, ${"1"}, ${1})
    ON CONFLICT (key) DO UPDATE SET prompt_version = EXCLUDED.prompt_version
    RETURNING id
  `) as IdRow[];
  return { id: rows[0].id };
}

export async function createAnalysisRun(input: {
  templateId: string;
  accountId: string;
  tweetIds: string[];
  modelLabel: string | null;
}): Promise<string> {
  const sql = requireSql();
  const rows = (await sql`
    INSERT INTO analysis_runs (template_id, scope, input_ref, status, model)
    VALUES (
      ${input.templateId},
      'batch',
      ${sql.json({
        accountId: input.accountId,
        tweetIds: input.tweetIds,
      } as postgres.JSONValue)},
      'running',
      ${input.modelLabel}
    )
    RETURNING id
  `) as IdRow[];
  return rows[0].id;
}

export async function completeAnalysisRun(
  runId: string,
  patch: { status: string; tokenUsage?: unknown },
): Promise<void> {
  const sql = requireSql();
  await sql`
    UPDATE analysis_runs
    SET finished_at = now(),
        status = ${patch.status},
        token_usage = ${patch.tokenUsage != null ? sql.json(JSON.parse(JSON.stringify(patch.tokenUsage)) as postgres.JSONValue) : null}
    WHERE id = ${runId}
  `;
}

export async function insertAnalysisOutput(input: {
  runId: string;
  accountId: string;
  payload: unknown;
  schemaVersion: number;
  tweetIds: string[];
}): Promise<string> {
  const sql = requireSql();
  const rows = (await sql`
    INSERT INTO analysis_outputs (run_id, account_id, payload, payload_schema_version)
    VALUES (
      ${input.runId},
      ${input.accountId},
      ${sql.json(JSON.parse(JSON.stringify(input.payload)) as postgres.JSONValue)},
      ${input.schemaVersion}
    )
    RETURNING id
  `) as IdRow[];
  const outputId = rows[0].id;

  for (const tweetId of input.tweetIds) {
    await sql`
      INSERT INTO analysis_tweet_links (analysis_output_id, tweet_id)
      VALUES (${outputId}, ${tweetId})
      ON CONFLICT DO NOTHING
    `;
  }

  return outputId;
}

export async function getLatestAnalysisForAccount(
  accountId: string,
): Promise<XFeedAnalysisPublic | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = (await sql`
    SELECT o.id, o.run_id, o.account_id, o.created_at, o.payload, o.payload_schema_version,
           r.model, t.prompt_version, a.handle,
           ARRAY(
             SELECT l.tweet_id FROM analysis_tweet_links l
             WHERE l.analysis_output_id = o.id
           ) AS tweet_ids
    FROM analysis_outputs o
    JOIN analysis_runs r ON r.id = o.run_id
    LEFT JOIN analysis_templates t ON t.id = r.template_id
    JOIN monitored_accounts a ON a.id = o.account_id
    WHERE o.account_id = ${accountId}
    ORDER BY o.created_at DESC
    LIMIT 1
  `) as AnalysisJoinedRow[];

  const row = rows[0];
  if (!row) return null;

  return {
    outputId: row.id,
    runId: row.run_id,
    accountId: row.account_id,
    handle: row.handle,
    createdAt: row.created_at.toISOString(),
    model: row.model,
    templateKey: TEMPLATE_KEY,
    promptVersion: row.prompt_version ?? "1",
    schemaVersion: row.payload_schema_version,
    payload: row.payload,
    citedTweetIds: row.tweet_ids ?? [],
  };
}

export async function getAnalysisOutputById(outputId: string): Promise<XFeedAnalysisPublic | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = (await sql`
    SELECT o.id, o.run_id, o.account_id, o.created_at, o.payload, o.payload_schema_version,
           r.model, t.prompt_version, a.handle,
           ARRAY(
             SELECT l.tweet_id FROM analysis_tweet_links l
             WHERE l.analysis_output_id = o.id
           ) AS tweet_ids
    FROM analysis_outputs o
    JOIN analysis_runs r ON r.id = o.run_id
    LEFT JOIN analysis_templates t ON t.id = r.template_id
    JOIN monitored_accounts a ON a.id = o.account_id
    WHERE o.id = ${outputId}
    LIMIT 1
  `) as AnalysisJoinedRow[];

  const row = rows[0];
  if (!row) return null;

  return {
    outputId: row.id,
    runId: row.run_id,
    accountId: row.account_id,
    handle: row.handle,
    createdAt: row.created_at.toISOString(),
    model: row.model,
    templateKey: TEMPLATE_KEY,
    promptVersion: row.prompt_version ?? "1",
    schemaVersion: row.payload_schema_version,
    payload: row.payload,
    citedTweetIds: row.tweet_ids ?? [],
  };
}

export async function loadRecentTweetTexts(
  accountId: string,
  limit: number,
): Promise<{ tweetId: string; createdAt: string; text: string }[]> {
  const sql = requireSql();
  const lim = Math.min(Math.max(limit, 1), 80);
  const rows = (await sql`
    SELECT tweet_id, created_at, text
    FROM tweets
    WHERE account_id = ${accountId}
    ORDER BY created_at DESC, tweet_id DESC
    LIMIT ${lim}
  `) as RecentTweetTextRow[];
  return rows.map((r) => ({
    tweetId: r.tweet_id,
    createdAt: r.created_at.toISOString(),
    text: r.text,
  }));
}
