import { z } from "zod";
import { defineJob, RETRY_STANDARD } from "./define.js";

/**
 * Job add-on, ngoài 10 job MVP của `job-queue.md` §7.1 — xem ghi chú §7.1
 * ("dùng chung hạ tầng BullMQ/Valkey này nhưng không tính vào 10 job MVP") và
 * `07-addon/semantic-search.md` §7.2. Chưa có consumer.
 */
export const embedContent = defineJob({
  name: "embed:content",
  schedule: { kind: "event", spec: "Sự kiện" },
  payload: z.object({
    contentType: z.string().min(1),
    contentId: z.number().int().positive(),
    contentVersion: z.number().int().positive(),
    model: z.string().min(1),
  }),
  idempotencyKey: (p) =>
    `${p.contentType}:${p.contentId}:${p.contentVersion}:${p.model}`,
  idempotencyKeyFormat: "content_type:content_id:content_version:model",
  timeoutSeconds: 30,
  ownerStep: "P4.8",
  retry: RETRY_STANDARD,
});
