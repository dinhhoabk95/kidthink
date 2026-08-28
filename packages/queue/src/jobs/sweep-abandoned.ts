import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const sweepAbandoned = defineJob({
  name: "sweep:abandoned",
  schedule: {
    kind: "cron",
    pattern: "*/10 * * * *",
    tz: ICT,
    spec: "Mỗi 10 phút",
  },
  payload: z.object({ windowStart: z.string().optional() }),
  idempotencyKeyFormat: "window_start",
  timeoutSeconds: 120,
  ownerStep: "P1.6",
  retry: RETRY_STANDARD,
});
