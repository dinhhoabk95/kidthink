import { type JobName, jobSchema } from "@mindkid/queue";
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
import type { Consumer, JobContext } from "./types.js";

/**
 * Bảng tra consumer, thay cho `switch` 44 dòng.
 *
 * Kiểu mapped phủ đủ `JobName` nên **thiếu một consumer là lỗi biên dịch** —
 * không còn cần cổng runtime `validateJobRegistryConsumers` (nó nhận một danh
 * sách tên hardcode trong test, không đọc dispatcher thật, nên chưa từng bắt
 * được việc `account:purge` không có nhánh xử lý).
 */
/** Consumer đã xoá generic, nhận `job.data` thô và tự parse. */
export type ErasedConsumer = (
  rawPayload: unknown,
  ctx: JobContext
) => Promise<unknown>;

/**
 * Nối schema của job với consumer của nó. Tên là literal ở mỗi lời gọi, nên
 * `schema.parse` trả đúng kiểu payload mà `consumer` nhận — không ép kiểu.
 */
function bind<Name extends JobName>(
  name: Name,
  consumer: Consumer<Name>
): ErasedConsumer {
  const schema = jobSchema(name);
  return (rawPayload, ctx) => consumer(schema.parse(rawPayload), ctx);
}

/**
 * Bảng tra consumer, thay cho `switch` 44 dòng.
 *
 * `Record<JobName, …>` phủ đủ mọi job nên **thiếu một consumer là lỗi biên
 * dịch** — không còn cần cổng runtime `validateJobRegistryConsumers` (nó nhận
 * một danh sách tên hardcode trong test, không đọc dispatcher thật, nên chưa
 * từng bắt được việc `account:purge` không có nhánh xử lý).
 */
export const CONSUMERS: Record<JobName, ErasedConsumer> = {
  "account:purge": bind("account:purge", accountPurge),
  "backup:postgres": bind("backup:postgres", backupPostgres),
  "backup:verify": bind("backup:verify", backupVerify),
  "email:send": bind("email:send", emailSend),
  "embed:content": bind("embed:content", embedContent),
  "entitlement:expire": bind("entitlement:expire", entitlementExpire),
  "entitlement:soft-unlock-expire": bind(
    "entitlement:soft-unlock-expire",
    entitlementSoftUnlockExpire
  ),
  "image:cleanup-orphan": bind("image:cleanup-orphan", imageCleanupOrphan),
  "order:expire": bind("order:expire", orderExpire),
  "pdf:render": bind("pdf:render", pdfRender),
  "report:manual-grants-monthly": bind(
    "report:manual-grants-monthly",
    reportManualGrantsMonthly
  ),
  "rollup:daily": bind("rollup:daily", rollupDaily),
  "rollup:session": bind("rollup:session", rollupSession),
  "sweep:abandoned": bind("sweep:abandoned", sweepAbandoned),
  "sweep:pdf-cleanup": bind("sweep:pdf-cleanup", sweepPdfCleanup),
};
