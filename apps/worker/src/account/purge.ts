import { getOwnerDb, hardPurgeUser, users } from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { and, eq, lte } from "drizzle-orm";

/**
 * BR-ADL-01..10 & D-GY: Account Purge Worker Job.
 * Finds all accounts in 'deleted' status where purge_at <= now().
 * Hard deletes personal records (Group 1), anonymizes telemetry and email (Group 2),
 * and retains statutory records (Group 3).
 * Fails fast and alerts immediately upon error (BR-ADL-08).
 */
export async function runAccountPurgeJob(
  jobId: string
): Promise<{ purgedCount: number }> {
  const db = getOwnerDb();
  const now = new Date();

  // Find accounts due for purge (BR-ADL-01)
  const dueUsers = await db
    .select({ id: users.id, purgeAt: users.purgeAt })
    .from(users)
    .where(and(eq(users.status, "deleted"), lte(users.purgeAt, now)));

  let purgedCount = 0;
  for (const user of dueUsers) {
    try {
      const scheduledPurgeDate = user.purgeAt ?? now;
      const result = await hardPurgeUser(db, user.id, now, scheduledPurgeDate);
      if (result.purged) {
        purgedCount++;
      }
    } catch (err: unknown) {
      // BR-ADL-08: Alert on failure without blind retry
      alert("error", `Account purge job failed for user ${user.id}`, {
        jobId,
        userId: user.id,
        error: (err as Error)?.message || String(err),
      });
      throw err;
    }
  }

  console.info(
    `[account:purge] Job ${jobId} successfully processed and purged ${purgedCount} accounts.`
  );
  return { purgedCount };
}
