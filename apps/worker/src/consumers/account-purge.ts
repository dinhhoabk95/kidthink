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
/** Trần mỗi lượt chạy: lượt sau sẽ vét tiếp phần còn lại. */
const PURGE_BATCH_SIZE = 200;

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
        purgedCount++;
      }
    } catch (error: unknown) {
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

  logJobDone("account:purge", ctx, {
    purged: purgedCount,
    batch: targets.length,
  });
  // `remaining` báo còn tồn đọng để lượt sau vét tiếp.
  return { purgedCount, remaining: targets.length === PURGE_BATCH_SIZE };
};
