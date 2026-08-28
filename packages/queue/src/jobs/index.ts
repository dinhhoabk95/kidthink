import type { z } from "zod";
import { accountPurge } from "./account-purge.js";
import { backupPostgres } from "./backup-postgres.js";
import { backupVerify } from "./backup-verify.js";
import { emailSend } from "./email-send.js";
import { embedContent } from "./embed-content.js";
import { entitlementExpire } from "./entitlement-expire.js";
import { entitlementSoftUnlockExpire } from "./entitlement-soft-unlock-expire.js";
import { imageCleanupOrphan } from "./image-cleanup-orphan.js";
import { orderExpire } from "./order-expire.js";
import { pdfRender } from "./pdf-render.js";
import { reportManualGrantsMonthly } from "./report-manual-grants-monthly.js";
import { rollupDaily } from "./rollup-daily.js";
import { rollupSession } from "./rollup-session.js";
import { sweepAbandoned } from "./sweep-abandoned.js";
import { sweepPdfCleanup } from "./sweep-pdf-cleanup.js";

/**
 * Nguồn sự thật duy nhất cho mọi job nền. Thêm một job = thêm một file trong
 * thư mục này và một dòng ở đây; `JobName`, `JobPayloads`, `JOB_REGISTRY` và
 * bảng consumer trong worker đều suy ra từ mảng này, nên không danh sách nào
 * còn trôi lệch được nữa.
 *
 * Thứ tự theo `job-queue.md` §7.1: 10 job MVP trước, job add-on sau.
 */
export const JOB_DEFINITIONS = [
  rollupSession,
  rollupDaily,
  sweepAbandoned,
  entitlementExpire,
  orderExpire,
  accountPurge,
  emailSend,
  imageCleanupOrphan,
  backupPostgres,
  backupVerify,
  entitlementSoftUnlockExpire,
  reportManualGrantsMonthly,
  pdfRender,
  sweepPdfCleanup,
  embedContent,
] as const;

export type AnyJobDefinition = (typeof JOB_DEFINITIONS)[number];

export type JobName = AnyJobDefinition["name"];

export type JobPayloads = {
  [Name in JobName]: z.infer<
    Extract<AnyJobDefinition, { name: Name }>["payload"]
  >;
};

const BY_NAME = new Map<string, AnyJobDefinition>();
for (const job of JOB_DEFINITIONS) {
  BY_NAME.set(job.name, job);
}

export function findJob(name: string): AnyJobDefinition | undefined {
  return BY_NAME.get(name);
}

/**
 * Như `findJob` nhưng ném thay vì trả `undefined` — dùng ở đường chạy nơi tên
 * job không hợp lệ là lỗi lập trình, không phải dữ liệu xấu.
 */
export function requireJob(name: string): AnyJobDefinition {
  const job = BY_NAME.get(name);
  if (!job) {
    throw new Error(
      `Job '${name}' chưa được khai trong packages/queue/src/jobs/.`
    );
  }
  return job;
}

export function isJobName(name: string): name is JobName {
  return BY_NAME.has(name);
}

/**
 * Schema của một job, giữ được liên hệ tên → payload.
 *
 * Đây là **chỗ duy nhất** trong hệ thống job phải xoá generic: bản đồ tra theo
 * chuỗi (`Map<string, ...>`) không mang theo được liên hệ đó, trong khi
 * `JOB_DEFINITIONS` thì có. Nhờ một chỗ này mà dispatcher của worker nối
 * payload với consumer hoàn toàn có kiểu, không cần ép kiểu nào nữa.
 */
export function jobSchema<Name extends JobName>(
  name: Name
): z.ZodType<JobPayloads[Name]> {
  const schema: z.ZodTypeAny = requireJob(name).payload;
  return schema;
}
