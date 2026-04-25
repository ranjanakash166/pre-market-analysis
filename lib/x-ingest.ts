import {
  fetchUserByUsername,
  fetchUserTweetsPage,
  maxTweetId,
  XApiRequestError,
  type XTweetEntity,
  type XMediaEntity,
} from "@/lib/x-client";
import {
  finishIngestionRun,
  startIngestionRun,
  updateAccountFetchError,
  updateAccountFetchSuccess,
  updateAccountXUser,
  upsertTweetBundle,
} from "@/lib/x-repo";

const MAX_BACKFILL_PAGES = 5;
const MAX_CATCHUP_PAGES = 8;

function mediaForTweet(tweet: XTweetEntity, mediaByKey: Map<string, XMediaEntity>) {
  const keys = tweet.attachments?.media_keys ?? [];
  return keys.map((key) => {
    const m = mediaByKey.get(key);
    return {
      mediaKey: m?.media_key ?? key,
      type: m?.type ?? null,
      url: m?.url ?? null,
      previewImageUrl: m?.preview_image_url ?? null,
      width: m?.width ?? null,
      height: m?.height ?? null,
      metadata: m ?? {},
    };
  });
}

export async function ingestOneAccount(input: {
  id: string;
  handle: string;
  x_user_id: string | null;
  last_seen_tweet_id: string | null;
}): Promise<{ accountId: string; ok: boolean; newTweets: number; error?: string }> {
  const runId = await startIngestionRun(input.id);

  try {
    let userId = input.x_user_id;

    if (!userId) {
      const user = await fetchUserByUsername(input.handle);
      userId = user.id;
      await updateAccountXUser(input.id, user.id, user.name ?? user.username);
    }

    let paginationToken: string | undefined;
    let page = 0;
    const maxPages = input.last_seen_tweet_id ? MAX_CATCHUP_PAGES : MAX_BACKFILL_PAGES;

    const collectedIds: string[] = [];
    let newCount = 0;
    let isFirstPage = true;

    while (page < maxPages) {
      const sinceId =
        isFirstPage && input.last_seen_tweet_id ? input.last_seen_tweet_id : undefined;
      const pageResult = await fetchUserTweetsPage(userId, {
        sinceId,
        paginationToken,
        maxResults: 100,
      });
      isFirstPage = false;
      page += 1;

      for (const t of pageResult.tweets) {
        if (!t.id) continue;
        collectedIds.push(t.id);

        const createdAt = t.created_at ?? new Date().toISOString();
        const text = t.text ?? "";

        const isNew = await upsertTweetBundle({
          accountId: input.id,
          tweet: {
            id: t.id,
            text,
            createdAt,
            authorId: t.author_id,
            lang: t.lang,
            possiblySensitive: t.possibly_sensitive,
            conversationId: t.conversation_id,
            jsonRaw: t,
          },
          media: mediaForTweet(t, pageResult.mediaByKey),
        });
        if (isNew) newCount += 1;
      }

      paginationToken = pageResult.nextToken;
      if (!paginationToken) break;

      // Incremental pull: usual case returns one page when caught up.
      if (input.last_seen_tweet_id && page >= MAX_CATCHUP_PAGES) break;
    }

    const candidateMax =
      collectedIds.length > 0
        ? maxTweetId(collectedIds)
        : input.last_seen_tweet_id ?? null;
    const nextLast =
      candidateMax && input.last_seen_tweet_id
        ? maxTweetId([candidateMax, input.last_seen_tweet_id])!
        : candidateMax ?? input.last_seen_tweet_id ?? null;

    await updateAccountFetchSuccess(input.id, nextLast);

    await finishIngestionRun(runId, {
      status: "ok",
      newTweetsCount: newCount,
      httpStatus: 200,
      cursorDebug: { pages: page },
    });

    return { accountId: input.id, ok: true, newTweets: newCount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const httpStatus = e instanceof XApiRequestError ? e.httpStatus : undefined;
    await updateAccountFetchError(input.id, msg);
    await finishIngestionRun(runId, {
      status: "error",
      newTweetsCount: 0,
      error: msg,
      ...(httpStatus != null ? { httpStatus } : {}),
    });
    return { accountId: input.id, ok: false, newTweets: 0, error: msg };
  }
}
