import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const reportManualGrantsMonthly = defineJob({
  name: "report:manual-grants-monthly",
  schedule: {
    kind: "cron",
    pattern: "0 0 1 * *",
    tz: ICT,
    spec: "00:00 ICT mùng 1 hàng tháng",
  },
  payload: z.object({ month: z.string().optional() }),
  idempotencyKeyFormat: "month_ict",
  timeoutSeconds: 300,
  ownerStep: "P2.4",
  retry: RETRY_STANDARD,
});
