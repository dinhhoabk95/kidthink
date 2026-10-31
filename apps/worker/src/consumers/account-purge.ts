import { type AuditTx, writeAudit } from "@mindkid/audit";
import {
  childProfiles,
  getOwnerDb,
  hardPurgeChildProfile,
  hardPurgeUser,
  users,
} from "@mindkid/db";
import { alert } from "@mindkid/queue";
import { and, eq, inArray, lte } from "drizzle-orm";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer, JobContext } from "./types.js";

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
/** Trần mỗi lượt chạy: lượt sau sẽ vét tiếp phần còn lại. */
const PURGE_BATCH_SIZE = 200;

/**
 * Hồ sơ trẻ `pending_deletion` / `archived` đã quá `purge_at`. Hồ sơ của tài
 * khoản `deleted` đã được `hardPurgeUser` xoá ở bước 1 theo `users.purge_at`.
 */
async function purgeDueChildProfiles(
  db: ReturnType<typeof getOwnerDb>,
  now: Date,
  ctx: JobContext
): Promise<{ purged: number; batch: number }> {
  const due = await db
    .select({ id: childProfiles.id, uuid: childProfiles.uuid })
    .from(childProfiles)
    .where(
      and(
        inArray(childProfiles.status, ["pending_deletion", "archived"]),
        lte(childProfiles.purgeAt, now)
      )
    )
    .limit(PURGE_BATCH_SIZE);

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

export const accountPurge: Consumer<"account:purge"> = async (payload, ctx) => {
  const db = getOwnerDb();
  const now = new Date();

  // Điều kiện đi vào CÂU TRUY VẤN, và có trần. Bản cũ nạp toàn bộ tập đến hạn
  // rồi mới lọc `payload.userId` trong JS: xoá một tài khoản vẫn quét và dựng
  // mọi hàng đến hạn, và một tồn đọng lớn thì không thể xử hết trong 900s.
  const conditions = [eq(users.status, "deleted"), lte(users.purgeAt, now)];
  if (payload.userId) {
    conditions.push(eq(users.id, payload.userId));
  }

  const targets = await db
    .select({ id: users.id, purgeAt: users.purgeAt })
    .from(users)
    .where(and(...conditions))
    .limit(PURGE_BATCH_SIZE);

  let purgedCount = 0;
  for (const user of targets) {
    // `runWithTimeout` chỉ abort signal rồi đánh job `failed` — nó Cấm — NEVER
    // huỷ được promise đang chạy. Consumer nào không đọc signal thì vẫn chạy
    // tiếp sau khi đã bị tuyên bố thất bại; ở đây nghĩa là tiếp tục xoá cứng dữ
    // liệu người dùng mà không job nào còn theo dõi.
    if (ctx.signal.aborted) {
      break;
    }

    try {
      const result = await hardPurgeUser(db, user.id, now, user.purgeAt ?? now);
      if (result.purged) {
        await recordPurgeAudit(db, {
          entityType: "user",
          entityId: user.id,
          purgedAt: now,
        });
        purgedCount++;
      }
    } catch (error) {
      // Thông điệp phải là HẰNG: `DeduplicatingAlertAdapter` gộp theo
      // `severity:message` và Cấm — NEVER dọn cache. Nhét `user.id` vào thông
      // điệp làm cửa sổ gộp 15 phút vô tác dụng (200 user hỏng = 200 alert) và
      // để lại 200 khoá vĩnh viễn trong Map của một tiến trình chạy hàng tuần.
      await alert("error", "Account purge job failed", {
        jobId: ctx.jobId,
        userId: user.id,
        error: readErrorMessage(error),
      });
      throw error;
    }
  }

  // Bước 2 (UC-019, UC-027 BR-001): hồ sơ trẻ đã quá `purge_at`.
  const children = payload.userId
    ? { purged: 0, batch: 0 }
    : await purgeDueChildProfiles(db, now, ctx);
  const purgedChildren = children.purged;

  logJobDone("account:purge", ctx, {
    purged: purgedCount,
    batch: targets.length,
    purgedChildren,
  });
  // `remaining` báo còn tồn đọng để lượt sau vét tiếp.
  return {
    purgedCount,
    purgedChildren,
    remaining:
      targets.length === PURGE_BATCH_SIZE ||
      children.batch === PURGE_BATCH_SIZE,
  };
};
