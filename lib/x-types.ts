/** Stored tweet row exposed to API consumers. */
export type TweetPublic = {
  tweetId: string;
  accountId: string;
  handle: string;
  createdAt: string;
  text: string;
  lang: string | null;
  possiblySensitive: boolean | null;
  conversationId: string | null;
  permalink: string;
  media: {
    mediaKey: string | null;
    type: string | null;
    url: string | null;
    previewImageUrl: string | null;
    width: number | null;
    height: number | null;
  }[];
};

export type MonitoredAccountPublic = {
  id: string;
  handle: string;
  displayName: string | null;
  status: string;
  pollIntervalSeconds: number;
  lastFetchAt: string | null;
  lastSeenTweetId: string | null;
  lastError: string | null;
};

export type XFeedAnalysisPublic = {
  outputId: string;
  runId: string;
  accountId: string;
  handle: string;
  createdAt: string;
  model: string | null;
  templateKey: string;
  promptVersion: string;
  schemaVersion: number;
  payload: unknown;
  citedTweetIds: string[];
};
