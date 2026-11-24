import { createLocalDoSqlStorage, type LocalDoSqlStorage } from "@mindkid/db";
import {
  type JobName,
  JobQueueSqlEngine,
  type QueueDeadLetterReporter,
  type QueueJobHandler,
  registerQueuePort,
} from "@mindkid/queue";
import { createTimerAlarmStorage } from "./timer-alarm.js";

/** Cửa sổ gộp alarm của engine; SQLite trong tiến trình không cần gộp ghi nên đặt 0. */
const LOCAL_BATCH_WINDOW_MS = 0;
const DEFAULT_POLL_INTERVAL_MS = 1000;

export type QueuedJobJson =
  | string
  | number
  | boolean
  | null
  | QueuedJobJson[]
  | { [key: string]: QueuedJobJson };

/** Hình dạng đủ cho test/chẩn đoán: `data` là payload đã parse (luôn là object — `def.parse`). */
export interface PeekedQueuedJob {
  readonly attempts: number;
  readonly data: { [key: string]: QueuedJobJson };
  readonly id: string;
  readonly name: JobName;
}

export interface LocalQueueRuntime {
  /** Huỷ alarm/poll, gỡ port và đóng handle SQLite. */
  close(): void;
  readonly engine: JobQueueSqlEngine;
  /** Xem một job còn trong hàng đợi (test, chẩn đoán); `undefined` nếu đã chạy xong hoặc chưa có. */
  peek(jobId: string): PeekedQueuedJob | undefined;
  /** Xoá mọi job, dead letter và dấu khử trùng. */
  reset(): void;
}

let currentRuntime: LocalQueueRuntime | undefined;

/** Runtime queue đang nối (nếu có) — test dùng để `peek` job vừa enqueue. */
export function getLocalQueueRuntime(): LocalQueueRuntime | undefined {
  return currentRuntime;
}

function buildRuntime(
  engine: JobQueueSqlEngine,
  sql: LocalDoSqlStorage,
  stop: () => void
): LocalQueueRuntime {
  const runtime: LocalQueueRuntime = {
    engine,
    peek(jobId) {
      // `getStats` buộc engine tạo schema nếu chưa có job nào được đẩy.
      engine.getStats().catch(() => undefined);
      const row = sql
        .exec(
          "SELECT job_id, name, payload_json, attempts FROM queued_jobs WHERE job_id = ?",
          jobId
        )
        .toArray()[0];
      if (!row) {
        return undefined;
      }
      return {
        id: String(row.job_id),
        name: String(row.name) as JobName,
        data: JSON.parse(String(row.payload_json)) as {
          [key: string]: QueuedJobJson;
        },
        attempts: Number(row.attempts),
      };
    },
    reset() {
      engine.getStats().catch(() => undefined);
      sql.exec("DELETE FROM queued_jobs");
      sql.exec("DELETE FROM dead_letter_jobs");
      sql.exec("DELETE FROM completed_job_ids");
    },
    close() {
      stop();
      registerQueuePort(undefined);
      if (currentRuntime === runtime) {
        currentRuntime = undefined;
      }
      sql.close();
    },
  };
  return runtime;
}

/**
 * Phía producer (web dev, test): đẩy job vào file SQLite nhưng KHÔNG chạy job —
 * không gắn alarm, nên consumer ở tiến trình khác (`apps/worker`) mới là bên
 * `drainBatch()`. Nối `JobQueueSqlEngine` vào port queue (D15, `BR-JOB-16`).
 */
export function startLocalQueueProducer(filePath: string): LocalQueueRuntime {
  const sql = createLocalDoSqlStorage(filePath);
  const engine = new JobQueueSqlEngine({
    sql,
    batchWindowMs: LOCAL_BATCH_WINDOW_MS,
    alarms: {
      getAlarm: () => Promise.resolve(null),
      setAlarm: () => Promise.resolve(),
    },
    handler: () =>
      Promise.reject(
        new Error("Producer local không chạy job: hãy chạy apps/worker")
      ),
  });
  registerQueuePort(engine);
  currentRuntime = buildRuntime(engine, sql, () => undefined);
  return currentRuntime;
}

export interface LocalQueueConsumerOptions {
  readonly filePath: string;
  readonly handler: QueueJobHandler;
  readonly onDeadLetter?: QueueDeadLetterReporter;
  readonly pollIntervalMs?: number;
}

/**
 * Phía consumer (`apps/worker` dev): cùng engine với `JobQueueDO`, alarm giả lập
 * bằng timer, cộng một vòng poll mỗi `pollIntervalMs` để nhặt job do tiến trình
 * khác đẩy vào cùng file (web không gắn alarm). Một cờ `draining` ngăn alarm và
 * poll chạy chồng — hai lượt `drainBatch()` song song sẽ chạy trùng một job.
 */
export function startLocalQueueConsumer(
  options: LocalQueueConsumerOptions
): LocalQueueRuntime {
  const sql = createLocalDoSqlStorage(options.filePath);
  let draining = false;

  async function drain(): Promise<void> {
    if (draining) {
      return;
    }
    draining = true;
    try {
      await engine.drainBatch();
    } finally {
      draining = false;
    }
  }

  const alarms = createTimerAlarmStorage(drain);
  const engine = new JobQueueSqlEngine({
    sql,
    batchWindowMs: LOCAL_BATCH_WINDOW_MS,
    alarms,
    handler: options.handler,
    onDeadLetter: options.onDeadLetter,
  });
  const poll = setInterval(() => {
    drain().catch((error: Error) =>
      console.error(`[local-runtime] drain failed: ${error.message}`)
    );
  }, options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
  // Không `unref`: worker dev chỉ sống nhờ vòng poll này (trước đây BullMQ giữ
  // tiến trình). `close()` gỡ timer.

  registerQueuePort(engine);
  currentRuntime = buildRuntime(engine, sql, () => {
    clearInterval(poll);
    alarms.cancel();
  });
  return currentRuntime;
}
