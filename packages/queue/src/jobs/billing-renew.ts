import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const billingRenew = defineJob({
  name: "billing:renew",
  schedule: { kind: "cron", pattern: "30 0 * * *", tz: ICT, spec: "00:30 ICT" },
  payload: z.object({ dateIct: z.string().optional() }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 300,
  ownerStep: "P5.1",
  retry: RETRY_STANDARD,
});
