import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const entitlementExpire = defineJob({
  name: "entitlement:expire",
  schedule: { kind: "cron", pattern: "5 0 * * *", tz: ICT, spec: "00:05 ICT" },
  payload: z.object({ dateIct: z.string().optional() }),
  idempotencyKeyFormat: "date_ict",
  timeoutSeconds: 300,
  ownerStep: "P1.5",
  retry: RETRY_STANDARD,
});
