import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const billingRenewalReminder = defineJob({
  name: "billing:renewal-reminder",
  schedule: { kind: "cron", pattern: "0 8 * * *", tz: ICT, spec: "08:00 ICT" },
  payload: z.object({ dateIct: z.string().optional() }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 300,
  ownerStep: "P5.1",
  retry: RETRY_STANDARD,
});
