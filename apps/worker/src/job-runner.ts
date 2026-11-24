import {
  alert,
  type JobName,
  type QueueDeadLetterReporter,
  requireJob,
} from "@mindkid/queue";
import { CONSUMERS } from "#src/consumers/index";
import { runWithTimeout } from "#src/run-with-timeout";

/**
 * Chạy một job qua consumer của nó: tra định nghĩa, parse payload ở đầu nhận
 * (`BR-JOB-02`), rồi áp timeout theo loại job. Dùng chung cho `JobQueueDO` trên
 * Cloudflare và vòng drain dev (`worker.ts`) — một đường chạy, một hành vi (D15).
 */
export async function runJobConsumer(input: {
  readonly jobId: string;
  readonly name: JobName;
  readonly payload: object | string | number | boolean | null;
  readonly attempt: number;
  readonly timeoutSeconds: number;
}): Promise<void> {
  const validated = requireJob(input.name).parse(input.payload);
  await runWithTimeout(input.name, input.timeoutSeconds, async (signal) => {
    await CONSUMERS[input.name](validated, {
      jobId: input.jobId,
      attempt: input.attempt,
      signal,
    });
  });
}

/**
 * `BR-JOB-05` — job fail hết retry Cấm bị bỏ im lặng; engine chỉ gọi hàm này khi hết
 * lượt retry hoặc job khai `alertOnFailImmediately`, nên mỗi sự việc đúng một alert.
 */
export const reportJobDeadLetter: QueueDeadLetterReporter = async (info) => {
  await alert(info.critical ? "critical" : "error", `Job ${info.name} failed`, {
    jobId: info.jobId,
    attempts: info.attempts,
    maxAttempts: info.maxAttempts,
    error: info.errorMessage,
  });
};
