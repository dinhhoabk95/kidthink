import { z } from "zod";
import { defineJob, ICT, RETRY_STANDARD } from "./define.js";

export const entitlementSoftUnlockExpire = defineJob({
  name: "entitlement:soft-unlock-expire",
  schedule: { kind: "cron", pattern: "0 * * * *", tz: ICT, spec: "Mỗi giờ" },
  payload: z.object({ hour: z.string().optional() }),
  idempotencyKeyFormat: "hour",
  timeoutSeconds: 120,
  ownerStep: "P2.3",
  retry: RETRY_STANDARD,
});
