import { z } from "zod";
import { defineJob, ICT, RETRY_BACKUP } from "./define.js";

export const backupPostgres = defineJob({
  name: "backup:postgres",
  schedule: { kind: "cron", pattern: "0 1 * * *", tz: ICT, spec: "01:00 ICT" },
  payload: z.object({ dateIct: z.string().optional() }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 1800,
  ownerStep: "P0.8",
  retry: RETRY_BACKUP,
});
