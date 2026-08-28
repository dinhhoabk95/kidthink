import { z } from "zod";
import { defineJob, RETRY_STANDARD } from "./define.js";

export const rollupSession = defineJob({
  name: "rollup:session",
  schedule: { kind: "event", spec: "Sự kiện — sau `game_completed`" },
  payload: z.object({ sessionUuid: z.string().min(1) }),
  idempotencyKey: (p) => p.sessionUuid,
  idempotencyKeyFormat: "session_uuid",
  timeoutSeconds: 30,
  ownerStep: "P1.7",
  retry: RETRY_STANDARD,
});
