import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const imageCleanupOrphan = defineJob({
  name: "image:cleanup-orphan",
  schedule: {
    kind: "cron",
    pattern: "0 4 * * 0",
    tz: ICT,
    spec: "04:00 ICT chủ nhật",
  },
  payload: z.object({ week: z.string().optional() }),
  idempotencyKeyFormat: "week",
  timeoutSeconds: 900,
  ownerStep: "P2.7",
  retry: RETRY_STANDARD,
});
