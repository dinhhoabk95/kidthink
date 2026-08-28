import { z } from "zod";
import { defineJob } from "./define.js";

/**
 * Khoá idempotency là `notificationId`, không phải địa chỉ nhận. Trước Task này
 * bốn producer gửi `{to, template, data}` — không khớp trường nào consumer đọc,
 * và không chứa khoá nào nên cả bốn rơi về jobId `email:send:default`, khiến
 * BullMQ khử trùng tất cả trừ cái đầu tiên.
 */
export const emailSend = defineJob({
  name: "email:send",
  schedule: { kind: "event", spec: "Sự kiện" },
  payload: z.object({
    notificationId: z.number().int().positive(),
    to: z.string().email(),
    code: z.string().min(1),
    payload: z.record(z.string(), z.unknown()),
    recipientStatus: z.enum(["active", "deleted"]).optional(),
    userOptOut: z.boolean().optional(),
    isBouncing: z.boolean().optional(),
  }),
  idempotencyKey: (p) => p.notificationId,
  idempotencyKeyFormat: "notification_id",
  timeoutSeconds: 30,
  ownerStep: "P0.9b",
  retry: { maxAttempts: 5, backoffType: "exponential", backoffDelayMs: 30_000 },
});
