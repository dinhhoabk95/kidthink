import { ServiceUnavailableError } from "@mindkid/errors/common";
import {
  getQueuePort,
  type JobQueueCoordinatorPort,
  type QueuedJobEnvelope,
} from "./do-queue-driver.js";
import { type JobName, type JobPayloads, requireJob } from "./jobs/index.js";
import { buildDeterministicJobId } from "./registry.js";

export * from "./alert.js";
export * from "./cron-match.js";
export * from "./do-queue-driver.js";
export * from "./jobs/define.js";
export * from "./jobs/index.js";
export * from "./registry.js";

export interface EnqueueOptions {
  jobId?: string;
  delay?: number;
}

/**
 * `BR-JOB-02` — jobId xác định từ khoá nghiệp vụ, producer không tự bịa.
 *
 * Trả `undefined` cho job theo lịch không khai khoá: `buildEnvelope` sinh id riêng
 * cho mỗi lần chạy. Dùng một id cố định ở đó là cách khử luôn mọi lần chạy sau
 * lần đầu — đúng lỗi mà `cron.ts` cũ mắc phải.
 */
function resolveJobId(
  name: JobName,
  payload: unknown,
  options?: EnqueueOptions
): string | undefined {
  if (options?.jobId) {
    return options.jobId;
  }

  const key = requireJob(name).keyOf(payload);
  return key === undefined ? undefined : buildDeterministicJobId(name, key);
}

/**
 * Hàng đợi là ranh giới hệ thống, nên payload được parse ở cả hai đầu: tại đây
 * lúc đẩy, và trong dispatcher của worker lúc nhận. Trước Task này không đầu
 * nào parse, nên bốn route đẩy `email:send` với hình dạng consumer không đọc
 * được suốt nhiều tháng mà không cổng nào đỏ.
 */
function buildEnvelope<T extends JobName>(
  name: T,
  payload: JobPayloads[T],
  options?: EnqueueOptions
): QueuedJobEnvelope {
  const def = requireJob(name);
  const parsed = def.parse(payload);
  const resolvedId =
    resolveJobId(name, parsed, options) ??
    `${name}:${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    jobId: resolvedId,
    name,
    payloadJson: JSON.stringify(parsed),
    delayMs: options?.delay,
    maxAttempts: def.retry.maxAttempts,
    backoffType: def.retry.backoffType,
    backoffDelayMs: def.retry.backoffDelayMs,
    timeoutSeconds: def.timeoutSeconds,
    alertOnFailImmediately: def.retry.alertOnFailImmediately,
  };
}

/**
 * Đóng-khi-lỗi (BR-JOB-12, BR-JOB-16): chưa nối port thì KHÔNG có đường dự phòng
 * nào (job sẽ mất im lặng) — trả 503 để caller biết. Cloudflare nối stub `JobQueueDO`;
 * dev/test nối `JobQueueSqlEngine` trên SQLite (`@mindkid/local-runtime`).
 */
function requireQueuePort(): JobQueueCoordinatorPort {
  const port = getQueuePort();
  if (!port) {
    throw new ServiceUnavailableError();
  }
  return port;
}

export async function enqueue<T extends JobName>(
  name: T,
  payload: JobPayloads[T],
  options?: EnqueueOptions
): Promise<{ id: string; name: T }> {
  const port = requireQueuePort();
  const envelope = buildEnvelope(name, payload, options);
  await port.enqueueBatch([envelope]);
  return { id: envelope.jobId, name };
}

export async function enqueueBatch(
  items: readonly {
    readonly name: JobName;
    readonly payload: JobPayloads[JobName];
    readonly options?: EnqueueOptions;
  }[]
): Promise<{ readonly accepted: number }> {
  if (items.length === 0) {
    return { accepted: 0 };
  }
  const port = requireQueuePort();
  const envelopes = items.map((item) =>
    buildEnvelope(item.name, item.payload, item.options)
  );
  await port.enqueueBatch(envelopes);
  return { accepted: envelopes.length };
}

export async function getWaitingCount(): Promise<number> {
  return (await requireQueuePort().getStats()).waiting;
}

export async function getFailedCount(): Promise<number> {
  return (await requireQueuePort().getStats()).failed;
}
