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
/** Cửa sổ nhớ job đã xong để khử trùng khi cron/producer đẩy lại cùng `jobId` (BR-JOB-14). */
export const COMPLETED_JOB_RETENTION_MS = 48 * 60 * 60 * 1000;

/**
 * Động cơ hàng đợi SQLite nội bộ cho Cloudflare Durable Objects (`JobQueueDO`):
 * - Khử trùng theo `job_id` (`BR-JOB-02`).
 * - Single-Pending-Alarm: hàng trăm job đẩy vào trong cửa sổ 3 giây chỉ gọi `setAlarm()` đúng 1 lần
 *   (tiết kiệm 95%+ hạn ngạch 100.000 DO SQLite writes/ngày, mở trần lên 50.000-200.000+ jobs/ngày).
 * - Mỗi job rời hàng đợi và được ghi vào `completed_job_ids` (giữ 48 giờ) NGAY sau khi xong, nên lô
 *   bị ngắt giữa chừng không chạy lại job đã xong (`BR-JOB-14`); job hết lượt retry chuyển sang
 *   `dead_letter_jobs` kèm cảnh báo `BR-JOB-05`.
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
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS completed_job_ids (
        job_id TEXT PRIMARY KEY,
        done_at INTEGER NOT NULL
      );
    `);
    this.sql.exec(
      "CREATE INDEX IF NOT EXISTS idx_completed_job_ids_done_at ON completed_job_ids (done_at);"
    );
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

    const completedSince = nowMs - COMPLETED_JOB_RETENTION_MS;
    let skippedCompleted = 0;

    for (const job of jobs) {
      const alreadyDone = this.sql
        .exec(
          "SELECT 1 AS hit FROM completed_job_ids WHERE job_id = ? AND done_at > ?",
          job.jobId,
          completedSince
        )
        .toArray();
      if (alreadyDone.length > 0) {
        skippedCompleted += 1;
        continue;
      }
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

    if (skippedCompleted < jobs.length) {
      await this.scheduleSingleAlarmIfNeeded(earliestRunAt);
    }
    return { accepted: jobs.length - skippedCompleted };
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

  /** Job rời hàng đợi ngay; job chạy thành công còn được nhớ 48 giờ để khử trùng. */
  private markFinished(rowId: number, jobId: string, remember: boolean): void {
    if (remember) {
      this.sql.exec(
        "INSERT OR REPLACE INTO completed_job_ids (job_id, done_at) VALUES (?, ?)",
        jobId,
        Date.now()
      );
    }
    this.sql.exec("DELETE FROM queued_jobs WHERE id = ?", rowId);
  }

  /** BR-JOB-14: alert hỏng không được làm lô chạy lại. */
  private async reportDeadLetter(
    info: Parameters<QueueDeadLetterReporter>[0]
  ): Promise<void> {
    if (!this.onDeadLetter) {
      return;
    }
    try {
      await this.onDeadLetter(info);
    } catch (alertError) {
      const reason =
        alertError instanceof Error ? alertError.message : String(alertError);
      console.error(`[queue] onDeadLetter failed for ${info.jobId}: ${reason}`);
    }
  }

  async drainBatch(maxItems = DEFAULT_MAX_DRAIN_BATCH): Promise<{
    readonly processed: number;
    readonly failed: number;
  }> {
    this.ensureSchema();
    this.hasPendingAlarmInMemory = false;

    const nowMs = Date.now();
    this.sql.exec(
      "DELETE FROM completed_job_ids WHERE done_at <= ?",
      nowMs - COMPLETED_JOB_RETENTION_MS
    );
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
        this.markFinished(rowId, jobId, true);
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
          this.markFinished(rowId, jobId, false);
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

        if (exhausted || alertImmediate) {
          await this.reportDeadLetter({
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
      processed: Math.max(0, dueRows.length - failedCount),
      failed: failedCount,
    };
  }
}

const cfQueueAls = new AsyncLocalStorage<JobQueueCoordinatorPort>();
let cloudflareQueuePort: JobQueueCoordinatorPort | undefined;

/**
 * Chạy `fn` với `port` chỉ hiệu lực trong ngữ cảnh async của nó (`ALS.run`, workerd hỗ trợ;
 * `enterWith` thì không). Dùng cho consumer chạy trong `JobQueueDO`: engine của DO KHÔNG
 * được đăng ký toàn cục để mã ngoài DO (cron, web) không vô tình chạm vào nó.
 */
export function runWithCloudflareQueuePort<T>(
  port: JobQueueCoordinatorPort,
  fn: () => T
): T {
  return cfQueueAls.run(port, fn);
}

export function registerCloudflareQueuePort(
  port: JobQueueCoordinatorPort | undefined
): void {
  cloudflareQueuePort = port;
}

export function getCloudflareQueuePort(): JobQueueCoordinatorPort | undefined {
  return cfQueueAls.getStore() ?? cloudflareQueuePort;
}
