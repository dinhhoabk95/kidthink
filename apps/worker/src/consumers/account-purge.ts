import { getOwnerDb, hardPurgeUser, users } from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { and, eq, lte } from "drizzle-orm";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

/**
 * BR-ADL-01..10 & D-GY: tìm mọi tài khoản `deleted` có `purge_at <= now()`,
 * xoá cứng dữ liệu cá nhân, ẩn danh telemetry, giữ hồ sơ theo luật.
 *
 * `BR-ADL-08` / `BR-JOB-05`: fail thì alert ngay và không tự retry — job này
 * khai `maxAttempts: 1` cùng `alertOnFailImmediately` trong định nghĩa job.
 *
 * Trước Task này handler không được nối vào dispatcher, nên mọi job
 * `account:purge` rơi vào nhánh `default` và ném `Unknown job name`.
 */
export const accountPurge: Consumer<"account:purge"> = async (payload, ctx) => {
  const db = getOwnerDb();
  const now = new Date();

  const dueUsers = await db
    .select({ id: users.id, purgeAt: users.purgeAt })
    .from(users)
    .where(and(eq(users.status, "deleted"), lte(users.purgeAt, now)));

  const targets = payload.userId
    ? dueUsers.filter((user) => user.id === payload.userId)
    : dueUsers;

  let purgedCount = 0;
  for (const user of targets) {
    try {
      const result = await hardPurgeUser(db, user.id, now, user.purgeAt ?? now);
      if (result.purged) {
        purgedCount++;
      }
    } catch (error: unknown) {
      await alert("error", `Account purge job failed for user ${user.id}`, {
        jobId: ctx.jobId,
        userId: user.id,
        error: readErrorMessage(error),
      });
      throw error;
    }
  }

  logJobDone("account:purge", ctx, { purged: purgedCount });
  return { purgedCount };
};
