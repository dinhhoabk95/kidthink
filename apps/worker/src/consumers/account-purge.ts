import { type AuditTx, writeAudit } from "@mindkid/audit";
import { getAuthRedisClient } from "@mindkid/auth";
import { invalidateUserEntitlementsCache } from "@mindkid/cache";
import {
  getOwnerDb,
  hardPurgeChildProfile,
  hardPurgeUser,
  type OwnerDb,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { alert } from "@mindkid/queue";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer, JobContext } from "./types.js";

interface PurgedUserSessionSnapshot {
  readonly id: number;
  readonly token: string;
}

export interface AccountPurgeSweepResult {
  readonly purgedCount: number;
  readonly purgedChildren: number;
  readonly remaining: boolean;
}

export async function recordPurgeAudit(
  tx: AuditTx,
  entry:
    | { kind: "child_data_purged"; childUuid: string }
    | { kind: "user_deleted"; userId: number; purgedAt: Date }
    | { entityType: "user"; entityId: number | string; purgedAt: Date }
    | { entityType: "child_profile"; entityId: number | string; purgedAt: Date }
) {
  if ("kind" in entry) {
    if (entry.kind === "child_data_purged") {
      return await writeAudit(tx, {
        actor_type: "system",
        action: "child_data_purged",
        entity_type: "child_profile",
        entity_id: entry.childUuid,
        after_data: {
          child_uuid: entry.childUuid,
          purged: true,
          telemetry_anonymized: true,
        },
      });
    }
    return await writeAudit(tx, {
      actor_type: "system",
      action: "user_deleted",
      entity_type: "user",
      entity_id: String(entry.userId),
      reason: "account_deletion_grace_expired",
      after_data: {
        purged_at: entry.purgedAt.toISOString(),
        telemetry_anonymized: true,
      },
    });
  }

  if (entry.entityType === "child_profile") {
    return await writeAudit(tx, {
      actor_type: "system",
      action: "child_data_purged",
      entity_type: "child_profile",
      entity_id: String(entry.entityId),
      after_data: {
        child_id: entry.entityId,
        purged: true,
        purged_at: entry.purgedAt.toISOString(),
        telemetry_anonymized: true,
      },
    });
  }

  return await writeAudit(tx, {
    actor_type: "system",
    action: "user_deleted",
    entity_type: "user",
    entity_id: String(entry.entityId),
    reason: "account_deletion_grace_expired",
    after_data: {
      purged_at: entry.purgedAt.toISOString(),
      telemetry_anonymized: true,
    },
  });
}

/** Trần mỗi lượt chạy: lượt sau sẽ vét tiếp phần còn lại. */
const PURGE_BATCH_SIZE = 200;

async function readUserSessionSnapshots(
  db: OwnerDb,
  userId: number
): Promise<readonly PurgedUserSessionSnapshot[]> {
  if (!db.query?.userSessions) {
    return [];
  }
  return await db.query.userSessions.findMany({
    columns: { id: true, token: true },
    where: { userId },
  });
}

async function revokePurgedUserRuntimeState(
  userId: number,
  sessions: readonly PurgedUserSessionSnapshot[]
): Promise<void> {
  const authKeys = [
    `ba:v1:user:active-sessions-${userId}`,
    ...sessions.flatMap((session) => [
      `ba:v1:user:${session.token}`,
      `ba:v1:user:reauth:${session.id}`,
    ]),
  ];

  if (authKeys.length > 0) {
    await getAuthRedisClient().del(...authKeys);
  }
  await invalidateUserEntitlementsCache(userId);
}

/**
 * Hồ sơ trẻ `pending_deletion` / `archived` đã quá `purge_at`. Hồ sơ của tài
 * khoản `deleted` đã được `hardPurgeUser` xoá ở bước 1 theo `users.purge_at`.
 */
async function purgeDueChildProfiles(
  db: OwnerDb,
  now: Date,
  ctx: JobContext
): Promise<{ purged: number; batch: number }> {
  const repos = createRepositories(db);
  const due = await repos.childProfiles.listDueForPurge(now, PURGE_BATCH_SIZE);

  let purged = 0;
  for (const child of due) {
    if (ctx.signal.aborted) {
      break;
    }
    try {
      await hardPurgeChildProfile(db, child.id, child.uuid);
      await recordPurgeAudit(db, {
        entityType: "child_profile",
        entityId: child.id,
        purgedAt: now,
      });
      purged++;
    } catch (error) {
      await alert("error", "Child profile purge job failed", {
        jobId: ctx.jobId,
        childId: child.id,
        error: readErrorMessage(error),
      });
      throw error;
    }
  }
  return { purged, batch: due.length };
}

export async function runAccountPurgeSweep(options?: {
  readonly userId?: number;
  readonly signal?: AbortSignal;
  readonly jobId?: string;
}): Promise<AccountPurgeSweepResult> {
  const db = getOwnerDb();
  const repos = createRepositories(db);
  const now = new Date();
  const ctx: JobContext = {
    jobId: options?.jobId ?? "account:purge:sweep",
    attempt: 1,
    signal: options?.signal ?? new AbortController().signal,
  };

  const targets = await repos.users.listDueForPurge(now, {
    userId: options?.userId,
    limit: PURGE_BATCH_SIZE,
  });

  let purgedCount = 0;
  for (const user of targets) {
    if (ctx.signal.aborted) {
      break;
    }

    try {
      const sessions = await readUserSessionSnapshots(db, user.id);
      const result = await hardPurgeUser(db, user.id, now, user.purgeAt ?? now);
      if (result.purged) {
        await revokePurgedUserRuntimeState(user.id, sessions);
        await recordPurgeAudit(db, {
          entityType: "user",
          entityId: user.id,
          purgedAt: now,
        });
        purgedCount++;
      }
    } catch (error) {
      await alert("error", "Account purge job failed", {
        jobId: ctx.jobId,
        userId: user.id,
        error: readErrorMessage(error),
      });
      throw error;
    }
  }

  const children = options?.userId
    ? { purged: 0, batch: 0 }
    : await purgeDueChildProfiles(db, now, ctx);
  const purgedChildren = children.purged;

  return {
    purgedCount,
    purgedChildren,
    remaining:
      targets.length === PURGE_BATCH_SIZE ||
      children.batch === PURGE_BATCH_SIZE,
  };
}

/**
 * BR-ADL-01..10 & D-GY: tìm mọi tài khoản `deleted` có `purge_at <= now()`,
 * xoá cứng dữ liệu cá nhân, thu hồi phiên AuthStore, ẩn danh telemetry, giữ hồ sơ theo luật.
 */
export const accountPurge: Consumer<"account:purge"> = async (payload, ctx) => {
  const result = await runAccountPurgeSweep({
    userId: payload.userId,
    signal: ctx.signal,
    jobId: ctx.jobId,
  });

  logJobDone("account:purge", ctx, {
    purged: result.purgedCount,
    purgedChildren: result.purgedChildren,
  });

  return result;
};
