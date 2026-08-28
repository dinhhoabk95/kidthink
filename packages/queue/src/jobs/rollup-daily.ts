import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const rollupDaily = defineJob({
  name: "rollup:daily",
  schedule: { kind: "cron", pattern: "0 2 * * *", tz: ICT, spec: "02:00 ICT" },
  payload: z.object({ dateIct: z.string().optional() }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 600,
  ownerStep: "P1.5",
  retry: RETRY_STANDARD,
});
