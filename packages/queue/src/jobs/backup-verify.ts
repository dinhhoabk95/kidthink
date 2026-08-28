import { z } from "zod";
import { defineJob, ICT, RETRY_BACKUP } from "./define.js";

export const backupVerify = defineJob({
  name: "backup:verify",
  schedule: {
    kind: "cron",
    pattern: "0 5 * * 1",
    tz: ICT,
    spec: "05:00 ICT thứ hai",
  },
  payload: z.object({
    source: z.string().optional(),
    week: z.string().optional(),
  }),
  idempotencyKeyFormat: "week",
  timeoutSeconds: 1800,
  ownerStep: "P0.8b",
  retry: RETRY_BACKUP,
});
