import { z } from "zod";
import { defineJob, ICT } from "./define.js";

/**
 * `BR-JOB-05` — purge chỉ thử một lần và fail thì alert ngay, vì nó xoá dữ
 * liệu: retry mù trên thao tác phá huỷ rủi ro hơn việc chạy muộn một ngày
 * (`job-queue.md` §7.2).
 */
export const accountPurge = defineJob({
  name: "account:purge",
  schedule: { kind: "cron", pattern: "0 3 * * *", tz: ICT, spec: "03:00 ICT" },
  payload: z.object({
    dateIct: z.string().optional(),
    userId: z.number().int().positive().optional(),
  }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 900,
  ownerStep: "P1.14",
  retry: {
    maxAttempts: 1,
    backoffType: "none",
    backoffDelayMs: 0,
    alertOnFailImmediately: true,
  },
});
