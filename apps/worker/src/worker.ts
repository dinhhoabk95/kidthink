import {
  type LocalAuthRuntime,
  type LocalQueueRuntime,
  resolveLocalEnginePath,
  startLocalAuthRuntime,
  startLocalQueueConsumer,
} from "@mindkid/local-runtime";
import { readErrorMessage } from "./errors.js";
import { reportJobDeadLetter, runJobConsumer } from "./job-runner.js";
import { startLocalCron } from "./local-cron.js";

/** Thời gian chờ tối đa cho worker tắt sạch. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

interface WorkerHandles {
  readonly auth: LocalAuthRuntime;
  readonly queue: LocalQueueRuntime;
  readonly stopCron: () => void;
}

let handles: WorkerHandles | undefined;

/**
 * Worker dev (D15, `BR-JOB-16`): chạy **cùng** `JobQueueSqlEngine` với `JobQueueDO`
 * trong tiến trình này, trên file SQLite dùng chung với web (web chỉ đẩy job).
 * Alarm của DO được giả lập bằng timer + vòng poll `drainBatch()`; cron là tick
 * 5 phút thay cho `triggers.crons`. Auth keyspace cũng là file chung với web để
 * consumer (vd `account:purge`) thấy đúng session đang có.
 */
export function startWorker(): LocalQueueRuntime {
  if (handles) {
    return handles.queue;
  }
  const auth = startLocalAuthRuntime(resolveLocalEnginePath("auth"));
  const queue = startLocalQueueConsumer({
    filePath: resolveLocalEnginePath("queue"),
    // Job lạ hoặc payload sai hình dạng ném lỗi ngay, đi theo đường retry/dead letter.
    handler: runJobConsumer,
    onDeadLetter: reportJobDeadLetter,
  });
  const stopCron = startLocalCron((jobs) => queue.engine.enqueueBatch(jobs));
  handles = { auth, queue, stopCron };
  return queue;
}

export function closeWorker(): void {
  if (handles) {
    handles.stopCron();
    handles.queue.close();
    handles.auth.close();
    handles = undefined;
  }
}

export function shutdown(signal: string): Promise<void> {
  console.info(`[worker] Nhận ${signal}, đang tắt.`);

  const forceExit = setTimeout(() => {
    console.error(
      `[worker] Không tắt xong trong ${SHUTDOWN_TIMEOUT_MS}ms, thoát cưỡng bức.`
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    closeWorker();
  } catch (error) {
    console.error(`[worker] Tắt không sạch: ${readErrorMessage(error)}`);
  } finally {
    clearTimeout(forceExit);
  }
  return Promise.resolve();
}
