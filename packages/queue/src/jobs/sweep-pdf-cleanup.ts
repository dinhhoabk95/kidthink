import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const sweepPdfCleanup = defineJob({
  name: "sweep:pdf-cleanup",
  schedule: {
    kind: "cron",
    pattern: "0 4 * * *",
    tz: ICT,
    spec: "04:00 ICT hàng ngày",
  },
  payload: z.object({ dateIct: z.string().optional() }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 300,
  ownerStep: "P4.2",
  retry: RETRY_STANDARD,
});
