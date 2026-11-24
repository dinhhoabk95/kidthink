import { AsyncLocalStorage } from "node:async_hooks";
import type { BackoffType } from "#src/jobs/define";
import type { JobName } from "#src/jobs/index";

export interface QueuedJobEnvelope {
  readonly jobId: string;
  readonly name: JobName;
  readonly payloadJson: string;
  readonly delayMs?: number;
  readonly maxAttempts: number;
  readonly backoffType: BackoffType;
  readonly backoffDelayMs: number;
  readonly timeoutSeconds: number;
  readonly alertOnFailImmediately?: boolean;
}

export interface JobQueueStats {
  readonly waiting: number;
  readonly failed: number;
}

export interface JobQueueCoordinatorPort {
  enqueueBatch(
    jobs: readonly QueuedJobEnvelope[]
  ): Promise<{ readonly accepted: number }>;
  getStats(): Promise<JobQueueStats>;
  drainBatch?(maxItems?: number): Promise<{
    readonly processed: number;
    readonly failed: number;
  }>;
}

export type QueueRowCell = string | number | null;

export interface MinimalDoSqlStorage {
  exec(
    query: string,
    ...bindings: QueueRowCell[]
  ): {
    toArray(): Record<string, QueueRowCell>[];
  };
}

export interface AlarmSchedulerPort {
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTimeMs: number): Promise<void>;
}

export type QueueJobHandler = (input: {
  readonly jobId: string;
  readonly name: JobName;
  readonly payload: object | string | number | boolean | null;
  readonly attempt: number;
  readonly timeoutSeconds: number;
}) => Promise<void>;

export type QueueDeadLetterReporter = (input: {
  readonly jobId: string;
  readonly name: JobName;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly errorMessage: string;
  readonly critical: boolean;
}) => Promise<void>;

export const DEFAULT_BATCH_WINDOW_MS = 3000;
export const DEFAULT_MAX_DRAIN_BATCH = 100;

/**
 * Động cơ hàng đợi SQLite nội bộ cho Cloudflare Durable Objects (`JobQueueDO`):
 * - Khử trùng theo `job_id` (`BR-JOB-02`).
 * - Single-Pending-Alarm: hàng trăm job đẩy vào trong cửa sổ 3 giây chỉ gọi `setAlarm()` đúng 1 lần
 *   (tiết kiệm 95%+ hạn ngạch 100.000 DO SQLite writes/ngày, mở trần lên 50.000-200.000+ jobs/ngày).
 * - Gom xoá toàn bộ lô hoàn tất bằng 1 câu SQL duy nhất; job hết lượt retry chuyển sang `dead_letter_jobs`
 *   kèm cảnh báo `BR-JOB-05`.
 */
export class JobQueueSqlEngine implements JobQueueCoordinatorPort {
  private readonly sql: MinimalDoSqlStorage;
  private readonly alarms: AlarmSchedulerPort;
  private readonly handler: QueueJobHandler;
  private readonly onDeadLetter?: QueueDeadLetterReporter;
  private readonly batchWindowMs: number;
  private hasPendingAlarmInMemory = false;
  private initialized = false;

  constructor(options: {
    readonly sql: MinimalDoSqlStorage;
    readonly alarms: AlarmSchedulerPort;
    readonly handler: QueueJobHandler;
    readonly onDeadLetter?: QueueDeadLetterReporter;
    readonly batchWindowMs?: number;
  }) {
    this.sql = options.sql;
    this.alarms = options.alarms;
    this.handler = options.handler;
    this.onDeadLetter = options.onDeadLetter;
    this.batchWindowMs = options.batchWindowMs ?? DEFAULT_BATCH_WINDOW_MS;
  }

  private ensureSchema(): void {
    if (this.initialized) {
      return;
    }
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS queued_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        backoff_type TEXT NOT NULL DEFAULT 'exponential',
        backoff_delay_ms INTEGER NOT NULL DEFAULT 5000,
        timeout_seconds INTEGER NOT NULL DEFAULT 30,
        alert_immediate INTEGER NOT NULL DEFAULT 0,
        run_at_ms INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL
      );
    `);
    this.sql.exec(
      "CREATE INDEX IF NOT EXISTS idx_queued_jobs_run_at ON queued_jobs (run_at_ms);"
    );
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS dead_letter_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        name TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL,
        last_error TEXT NOT NULL,
        failed_at_ms INTEGER NOT NULL
      );
    `);
    this.initialized = true;
  }

  private async scheduleSingleAlarmIfNeeded(
    targetTimeMs: number
  ): Promise<void> {
    if (this.hasPendingAlarmInMemory) {
      return;
    }
    const existing = await this.alarms.getAlarm();
    if (existing !== null && existing <= targetTimeMs) {
      this.hasPendingAlarmInMemory = true;
      return;
    }
    await this.alarms.setAlarm(targetTimeMs);
    this.hasPendingAlarmInMemory = true;
  }

  async enqueueBatch(
    jobs: readonly QueuedJobEnvelope[]
  ): Promise<{ readonly accepted: number }> {
    this.ensureSchema();
    if (jobs.length === 0) {
      return { accepted: 0 };
    }

    const nowMs = Date.now();
    let earliestRunAt = nowMs + this.batchWindowMs;

    for (const job of jobs) {
      const runAt = nowMs + Math.max(0, job.delayMs ?? 0);
      if (runAt < earliestRunAt) {
        earliestRunAt = Math.max(nowMs + this.batchWindowMs, runAt);
      }
      this.sql.exec(
        `INSERT INTO queued_jobs (
          job_id, name, payload_json, attempts, max_attempts,
          backoff_type, backoff_delay_ms, timeout_seconds, alert_immediate,
          run_at_ms, created_at_ms
        ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO NOTHING`,
        job.jobId,
        job.name,
        job.payloadJson,
        job.maxAttempts,
        job.backoffType,
        job.backoffDelayMs,
        job.timeoutSeconds,
        job.alertOnFailImmediately ? 1 : 0,
        runAt,
        nowMs
      );
    }

    await this.scheduleSingleAlarmIfNeeded(earliestRunAt);
    return { accepted: jobs.length };
  }

  getStats(): Promise<JobQueueStats> {
    this.ensureSchema();
    const waitingRow = this.sql
      .exec("SELECT COUNT(*) AS cnt FROM queued_jobs")
      .toArray()[0];
    const failedRow = this.sql
      .exec("SELECT COUNT(*) AS cnt FROM dead_letter_jobs")
      .toArray()[0];
    return Promise.resolve({
      waiting: Number(waitingRow?.cnt ?? 0),
      failed: Number(failedRow?.cnt ?? 0),
    });
  }

  private computeNextRunMs(
    nowMs: number,
    nextAttempt: number,
    backoffType: string,
    baseDelayMs: number
  ): number {
    if (backoffType === "none") {
      return nowMs + 1000;
    }
    if (backoffType === "fixed") {
      return nowMs + baseDelayMs;
    }
    return nowMs + baseDelayMs * 2 ** Math.max(0, nextAttempt - 1);
  }

  async drainBatch(maxItems = DEFAULT_MAX_DRAIN_BATCH): Promise<{
    readonly processed: number;
    readonly failed: number;
  }> {
    this.ensureSchema();
    this.hasPendingAlarmInMemory = false;

    const nowMs = Date.now();
    const dueRows = this.sql
      .exec(
        `SELECT id, job_id, name, payload_json, attempts, max_attempts,
                backoff_type, backoff_delay_ms, timeout_seconds, alert_immediate
         FROM queued_jobs
         WHERE run_at_ms <= ?
         ORDER BY run_at_ms ASC, id ASC
         LIMIT ?`,
        nowMs,
        maxItems
      )
      .toArray();

    const completedIds: number[] = [];
    let failedCount = 0;

    for (const row of dueRows) {
      const rowId = Number(row.id);
      const jobId = String(row.job_id);
      const jobName = String(row.name) as JobName;
      const payloadJson = String(row.payload_json);
      const nextAttempt = Number(row.attempts) + 1;
      const maxAttempts = Number(row.max_attempts);
      const backoffType = String(row.backoff_type);
      const backoffDelayMs = Number(row.backoff_delay_ms);
      const timeoutSeconds = Number(row.timeout_seconds);
      const alertImmediate = Number(row.alert_immediate) !== 0;

      try {
        const parsedPayload = JSON.parse(payloadJson) as
          | object
          | string
          | number
          | boolean
          | null;
        await this.handler({
          jobId,
          name: jobName,
          payload: parsedPayload,
          attempt: nextAttempt,
          timeoutSeconds,
        });
        completedIds.push(rowId);
      } catch (err) {
        failedCount += 1;
        const errMsg = err instanceof Error ? err.message : String(err);
        const exhausted = nextAttempt >= maxAttempts;

        if (exhausted) {
          this.sql.exec(
            `INSERT INTO dead_letter_jobs (job_id, name, payload_json, attempts, last_error, failed_at_ms)
             VALUES (?, ?, ?, ?, ?, ?)`,
            jobId,
            jobName,
            payloadJson,
            nextAttempt,
            errMsg.slice(0, 500),
            Date.now()
          );
          completedIds.push(rowId);
        } else {
          const retryAt = this.computeNextRunMs(
            Date.now(),
            nextAttempt,
            backoffType,
            backoffDelayMs
          );
          this.sql.exec(
            "UPDATE queued_jobs SET attempts = ?, run_at_ms = ? WHERE id = ?",
            nextAttempt,
            retryAt,
            rowId
          );
        }

        if ((exhausted || alertImmediate) && this.onDeadLetter) {
          await this.onDeadLetter({
            jobId,
            name: jobName,
            attempts: nextAttempt,
            maxAttempts,
            errorMessage: errMsg,
            critical: alertImmediate,
          });
        }
      }
    }

    if (completedIds.length > 0) {
      const placeholders = completedIds.map(() => "?").join(", ");
      this.sql.exec(
        `DELETE FROM queued_jobs WHERE id IN (${placeholders})`,
        ...completedIds
      );
    }

    const nextRow = this.sql
      .exec("SELECT MIN(run_at_ms) AS next_ms FROM queued_jobs")
      .toArray()[0];
    const nextRunMs = nextRow?.next_ms;
    if (typeof nextRunMs === "number") {
      await this.scheduleSingleAlarmIfNeeded(
        Math.max(Date.now() + 1000, nextRunMs)
      );
    }

    return {
      processed:
        completedIds.length - failedCount >= 0
          ? dueRows.length - failedCount
          : 0,
      failed: failedCount,
    };
  }
}

interface ScopedCloudflareQueueContext {
  readonly port: JobQueueCoordinatorPort | undefined;
  readonly waitUntilFn: ((promise: Promise<void>) => void) | undefined;
}

const cfQueueAls = new AsyncLocalStorage<ScopedCloudflareQueueContext>();
let cloudflareQueuePort: JobQueueCoordinatorPort | undefined;
let waitUntilDispatcher: ((promise: Promise<void>) => void) | undefined;

export function enterCloudflareQueuePort(
  port: JobQueueCoordinatorPort | undefined,
  waitUntilFn?: (promise: Promise<void>) => void
): void {
  cfQueueAls.enterWith({ port, waitUntilFn });
}

/**
 * Chạy `fn` với `port` chỉ hiệu lực trong ngữ cảnh async của nó (`ALS.run`, workerd hỗ trợ;
 * `enterWith` thì không). Dùng cho consumer chạy trong `JobQueueDO`: engine của DO KHÔNG
 * được đăng ký toàn cục để mã ngoài DO (cron, web) không vô tình chạm vào nó.
 */
export function runWithCloudflareQueuePort<T>(
  port: JobQueueCoordinatorPort,
  fn: () => T
): T {
  return cfQueueAls.run({ port, waitUntilFn: undefined }, fn);
}

export function registerCloudflareQueuePort(
  port: JobQueueCoordinatorPort | undefined,
  waitUntilFn?: (promise: Promise<void>) => void
): void {
  cloudflareQueuePort = port;
  waitUntilDispatcher = waitUntilFn;
}

export function getCloudflareQueuePort(): JobQueueCoordinatorPort | undefined {
  const scoped = cfQueueAls.getStore();
  if (scoped !== undefined) {
    return scoped.port;
  }
  return cloudflareQueuePort;
}

export function dispatchWaitUntilIfPresent(
  promise: Promise<void>
): Promise<void> {
  const scoped = cfQueueAls.getStore();
  const dispatcher =
    scoped === undefined ? waitUntilDispatcher : scoped.waitUntilFn;
  if (dispatcher) {
    dispatcher(promise);
    return Promise.resolve();
  }
  return promise;
}
