import { z } from "zod";
import { defineJob } from "./define.js";

export const pdfRender = defineJob({
  name: "pdf:render",
  schedule: { kind: "event", spec: "Sự kiện" },
  payload: z.object({
    exportJobUuid: z.string().min(1),
    userId: z.number().int().positive(),
    kind: z.enum(["lesson_plan", "worksheet", "curriculum_plan"]),
    refId: z.string().min(1),
  }),
  idempotencyKey: (p) => p.exportJobUuid,
  idempotencyKeyFormat: "export_job_uuid",
  timeoutSeconds: 120,
  ownerStep: "P4.2",
  retry: { maxAttempts: 2, backoffType: "exponential", backoffDelayMs: 5000 },
});
