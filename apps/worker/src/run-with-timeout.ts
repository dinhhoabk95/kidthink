/**
 * Tách khỏi `worker.ts` để entry Cloudflare không import `bullmq` (`BR-JOB-11`).
 */
class JobTimeoutError extends Error {
  constructor(name: string, timeoutSeconds: number) {
    super(`Job '${name}' vượt timeout ${timeoutSeconds}s và bị huỷ.`);
    this.name = "JobTimeoutError";
  }
}

/**
 * `job-queue.md` §5 — "Job treo | Timeout theo loại, chuyển `failed`, alert".
 *
 * `timeoutSeconds` có mặt ở cả 15 định nghĩa job từ đầu nhưng chưa nơi nào đọc,
 * nên một job treo giữ lock vô hạn. Consumer nào tôn trọng `ctx.signal` thì
 * dừng thật; consumer chưa tôn trọng vẫn bị đánh `failed` đúng hạn.
 */
export async function runWithTimeout<T>(
  name: string,
  timeoutSeconds: number,
  run: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

  try {
    return await Promise.race([
      run(controller.signal),
      new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new JobTimeoutError(name, timeoutSeconds));
        });
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
