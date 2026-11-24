import { z } from "zod";
import { defineJob } from "./define.js";

/**
 * `browser-push.md` §4.1 — gửi FCM Web tới mọi endpoint active của một User.
 * Payload không mang token thiết bị (`BR-BPS-04`) và không mang dữ liệu trẻ (`BR-BPS-05`).
 */
export const pushSend = defineJob({
  name: "push:send",
  schedule: { kind: "event", spec: "Sự kiện" },
  payload: z.object({
    notificationId: z.number().int().positive(),
    userId: z.number().int().positive(),
    title: z.string().min(1).max(200),
    body: z.string().max(1000),
    actionUrl: z.string().startsWith("/").max(500),
  }),
  idempotencyKey: (p) => p.notificationId,
  idempotencyKeyFormat: "notification_id",
  timeoutSeconds: 30,
  ownerStep: "P5",
  retry: { maxAttempts: 5, backoffType: "exponential", backoffDelayMs: 30_000 },
});
