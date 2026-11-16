import type { z } from "zod";
import { accountPurge } from "./account-purge.js";
import { backupPostgres } from "./backup-postgres.js";
import { backupVerify } from "./backup-verify.js";
import { billingDunningSweep } from "./billing-dunning-sweep.js";
import { billingRenew } from "./billing-renew.js";
import { billingRenewalReminder } from "./billing-renewal-reminder.js";
import { emailSend } from "./email-send.js";
import { entitlementExpire } from "./entitlement-expire.js";
import { entitlementSoftUnlockExpire } from "./entitlement-soft-unlock-expire.js";
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
 * Thứ tự theo `job-queue.md` §7.1: các job MVP trước, job add-on sau.
 */
export const JOB_DEFINITIONS = [
  rollupSession,
  rollupDaily,
  sweepAbandoned,
  entitlementExpire,
  orderExpire,
  accountPurge,
  emailSend,
  backupPostgres,
  backupVerify,
  entitlementSoftUnlockExpire,
  reportManualGrantsMonthly,
  pdfRender,
  sweepPdfCleanup,
  billingRenewalReminder,
  billingRenew,
  billingDunningSweep,
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

interface JobSchemaMap {
  readonly "rollup:session": z.ZodType<JobPayloads["rollup:session"]>;
  readonly "rollup:daily": z.ZodType<JobPayloads["rollup:daily"]>;
  readonly "sweep:abandoned": z.ZodType<JobPayloads["sweep:abandoned"]>;
  readonly "entitlement:expire": z.ZodType<JobPayloads["entitlement:expire"]>;
  readonly "order:expire": z.ZodType<JobPayloads["order:expire"]>;
  readonly "account:purge": z.ZodType<JobPayloads["account:purge"]>;
  readonly "email:send": z.ZodType<JobPayloads["email:send"]>;
  readonly "backup:postgres": z.ZodType<JobPayloads["backup:postgres"]>;
  readonly "backup:verify": z.ZodType<JobPayloads["backup:verify"]>;
  readonly "entitlement:soft-unlock-expire": z.ZodType<
    JobPayloads["entitlement:soft-unlock-expire"]
  >;
  readonly "report:manual-grants-monthly": z.ZodType<
    JobPayloads["report:manual-grants-monthly"]
  >;
  readonly "pdf:render": z.ZodType<JobPayloads["pdf:render"]>;
  readonly "sweep:pdf-cleanup": z.ZodType<JobPayloads["sweep:pdf-cleanup"]>;
  readonly "billing:renewal-reminder": z.ZodType<
    JobPayloads["billing:renewal-reminder"]
  >;
  readonly "billing:renew": z.ZodType<JobPayloads["billing:renew"]>;
  readonly "billing:dunning-sweep": z.ZodType<
    JobPayloads["billing:dunning-sweep"]
  >;
}

const JOB_SCHEMAS: JobSchemaMap = {
  "rollup:session": rollupSession.payload,
  "rollup:daily": rollupDaily.payload,
  "sweep:abandoned": sweepAbandoned.payload,
  "entitlement:expire": entitlementExpire.payload,
  "order:expire": orderExpire.payload,
  "account:purge": accountPurge.payload,
  "email:send": emailSend.payload,
  "backup:postgres": backupPostgres.payload,
  "backup:verify": backupVerify.payload,
  "entitlement:soft-unlock-expire": entitlementSoftUnlockExpire.payload,
  "report:manual-grants-monthly": reportManualGrantsMonthly.payload,
  "pdf:render": pdfRender.payload,
  "sweep:pdf-cleanup": sweepPdfCleanup.payload,
  "billing:renewal-reminder": billingRenewalReminder.payload,
  "billing:renew": billingRenew.payload,
  "billing:dunning-sweep": billingDunningSweep.payload,
};

/**
 * Schema của một job, giữ được liên hệ tên → payload qua bảng ánh xạ khóa tĩnh
 * `JOB_SCHEMAS` (không cần xóa generic hay ép kiểu).
 */
export function jobSchema<Name extends JobName>(
  name: Name
): z.ZodType<JobPayloads[Name]> {
  return JOB_SCHEMAS[name] as z.ZodType<JobPayloads[Name]>;
}
