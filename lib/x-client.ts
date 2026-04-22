const X_API_BASE = "https://api.twitter.com/2";

export type XApiError = {
  title?: string;
  detail?: string;
  status?: number;
};

export type XUserResult = {
  id: string;
  name: string;
  username: string;
};

export type XTweetEntity = {
  id: string;
  text?: string;
  created_at?: string;
  author_id?: string;
  conversation_id?: string;
  lang?: string;
  possibly_sensitive?: boolean;
  attachments?: { media_keys?: string[] };
};

export type XMediaEntity = {
  media_key?: string;
  type?: string;
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
};

export type FetchUserTweetsPage = {
  tweets: XTweetEntity[];
  mediaByKey: Map<string, XMediaEntity>;
  nextToken: string | undefined;
};

function bearer(): string {
  const t = process.env.X_API_BEARER_TOKEN?.trim();
  if (!t) {
    throw new Error("Missing X_API_BEARER_TOKEN for X API v2 requests");
  }
  return t;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

function resetMsFromHeaders(headers: Headers): number | undefined {
  const raw = headers.get("x-rate-limit-reset");
  if (!raw) return undefined;
  const sec = Number(raw);
  if (!Number.isFinite(sec)) return undefined;
  return Math.max(0, sec * 1000 - Date.now());
}

/**
 * GET /2/users/by/username/:username
 */
export async function fetchUserByUsername(username: string): Promise<XUserResult> {
  const url = `${X_API_BASE}/users/by/username/${encodeURIComponent(username)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer()}` },
    cache: "no-store",
  });

  if (res.status === 429) {
    const wait = resetMsFromHeaders(res.headers) ?? 60_000;
    await sleep(wait);
    return fetchUserByUsername(username);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { errors?: XApiError[] };
    const err = body.errors?.[0];
    throw new Error(
      `X user lookup failed (${res.status}): ${err?.detail ?? err?.title ?? res.statusText}`,
    );
  }

  const json = (await res.json()) as { data?: XUserResult };
  if (!json.data?.id) {
    throw new Error(`X user not found for @${username}`);
  }
  return json.data;
}

const TWEET_FIELDS =
  "created_at,text,author_id,conversation_id,lang,possibly_sensitive,attachments";
const MEDIA_FIELDS = "media_key,type,url,preview_image_url,width,height";
const EXPANSIONS = "attachments.media_keys";

function tweetsUrl(userId: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  search.set("max_results", params.max_results ?? "100");
  if (params.since_id) search.set("since_id", params.since_id);
  if (params.pagination_token) search.set("pagination_token", params.pagination_token);
  search.set("tweet.fields", TWEET_FIELDS);
  search.set("media.fields", MEDIA_FIELDS);
  search.set("expansions", EXPANSIONS);
  return `${X_API_BASE}/users/${encodeURIComponent(userId)}/tweets?${search.toString()}`;
}

/**
 * Single page GET /2/users/:id/tweets (handles 429 once by waiting for reset).
 */
export async function fetchUserTweetsPage(
  userId: string,
  opts: {
    sinceId?: string;
    paginationToken?: string;
    maxResults?: number;
  },
): Promise<FetchUserTweetsPage> {
  const url = tweetsUrl(userId, {
    max_results: String(opts.maxResults ?? 100),
    since_id: opts.sinceId,
    pagination_token: opts.paginationToken,
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer()}` },
    cache: "no-store",
  });

  if (res.status === 429) {
    const wait = resetMsFromHeaders(res.headers) ?? 60_000;
    await sleep(wait);
    return fetchUserTweetsPage(userId, opts);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { errors?: XApiError[] };
    const err = body.errors?.[0];
    throw new Error(
      `X timeline fetch failed (${res.status}): ${err?.detail ?? err?.title ?? res.statusText}`,
    );
  }

  const json = (await res.json()) as {
    data?: XTweetEntity[];
    includes?: { media?: XMediaEntity[] };
    meta?: { next_token?: string; result_count?: number };
  };

  const tweets = json.data ?? [];
  const mediaByKey = new Map<string, XMediaEntity>();
  for (const m of json.includes?.media ?? []) {
    if (m.media_key) mediaByKey.set(m.media_key, m);
  }

  return {
    tweets,
    mediaByKey,
    nextToken: json.meta?.next_token,
  };
}

export function maxTweetId(ids: string[]): string | undefined {
  if (ids.length === 0) return undefined;
  let best = ids[0];
  for (let i = 1; i < ids.length; i++) {
    try {
      if (BigInt(ids[i]) > BigInt(best)) best = ids[i];
    } catch {
      if (ids[i] > best) best = ids[i];
    }
  }
  return best;
}
