import { z } from "zod";
import { defineJob } from "#src/jobs/define";

/**
 * Ca âm cho `BR-JOB-02` (`BR-TYP-07` đòi mỗi cổng có ca âm).
 *
 * Job theo sự kiện mà không khai `idempotencyKey` là thứ đã tạo ra jobId
 * `email:send:default` dùng chung cho bốn loại email khác nhau. `defineJob`
 * phải ném ngay lúc khai, không đợi tới lúc chạy.
 */
export function defineEventJobWithoutIdempotencyKey() {
  return defineJob({
    name: "fixture:event-without-key",
    schedule: { kind: "event", spec: "Sự kiện" },
    payload: z.object({ someId: z.string() }),
    idempotencyKeyFormat: "some_id",
    timeoutSeconds: 30,
    ownerStep: "P0.0",
    retry: { maxAttempts: 3, backoffType: "exponential", backoffDelayMs: 5000 },
  });
}
