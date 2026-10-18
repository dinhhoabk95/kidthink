import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const billingDunningSweep = defineJob({
  name: "billing:dunning-sweep",
  schedule: { kind: "cron", pattern: "0 9 * * *", tz: ICT, spec: "09:00 ICT" },
  payload: z.object({ dateIct: z.string().optional() }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 300,
  ownerStep: "P5.1",
  retry: RETRY_STANDARD,
});
