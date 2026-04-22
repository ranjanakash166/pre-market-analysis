import { ingestOneAccount } from "@/lib/x-ingest";
import { runBatchAnalysisForAccount } from "@/lib/x-analysis";
import {
  getMonitoredAccountById,
  seedMonitoredHandlesFromEnv,
  selectAccountsDueForPoll,
} from "@/lib/x-repo";

export type XSyncResult = {
  seeded: number;
  ingest: {
    accountId: string;
    handle: string;
    ok: boolean;
    newTweets: number;
    error?: string;
  }[];
  analysis: { accountId: string; ok: boolean; error?: string }[];
};

/**
 * Cron entrypoint: seed handles from env, poll due accounts, analyze when new tweets arrive.
 */
export async function runXSyncPipeline(opts?: { accountLimit?: number }): Promise<XSyncResult> {
  const limit = opts?.accountLimit ?? 8;

  const { inserted } = await seedMonitoredHandlesFromEnv();

  const due = await selectAccountsDueForPoll(limit);

  const ingest: XSyncResult["ingest"] = [];

  for (const row of due) {
    const res = await ingestOneAccount({
      id: row.id,
      handle: row.handle,
      x_user_id: row.x_user_id,
      last_seen_tweet_id: row.last_seen_tweet_id,
    });

    ingest.push({
      accountId: row.id,
      handle: row.handle,
      ok: res.ok,
      newTweets: res.newTweets,
      error: res.error,
    });
  }

  const analysis: XSyncResult["analysis"] = [];

  for (const row of ingest) {
    if (!row.ok || row.newTweets <= 0) continue;

    const account = await getMonitoredAccountById(row.accountId);
    const h = account?.handle ?? row.handle;

    try {
      const out = await runBatchAnalysisForAccount(row.accountId, h);
      analysis.push({
        accountId: row.accountId,
        ok: !!out?.outputId,
      });
    } catch (e) {
      analysis.push({
        accountId: row.accountId,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { seeded: inserted, ingest, analysis };
}
