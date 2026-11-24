import { assertAlertingReachable } from "@mindkid/queue";
import { readErrorMessage } from "./errors.js";
import { startBacklogMonitor } from "./monitor.js";
import { shutdown, startWorker } from "./worker.js";

/**
 * Worker dev (Node). Không có handler cho `unhandledRejection` / `uncaughtException`
 * thì worker chết là chết im lặng, đúng bài học v1 ở `job-queue.md` §1.
 */
function registerShutdownHandlers(): void {
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      shutdown(signal)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(`[worker] Tắt không sạch: ${readErrorMessage(error)}`);
          process.exit(1);
        });
    });
  }
}

function main(): void {
  // Đăng ký trước mọi bước khác: SIGTERM tới giữa chừng phải tắt sạch.
  registerShutdownHandlers();

  // BR-MON-01 — before consuming a single job. This process is the one that
  // runs backups and sweeps; if every alert channel it has is a console.warn,
  // its failures reach nobody, and a backup that fails in silence is the exact
  // v1 outcome backup-and-restore.md §1 exists to prevent.
  assertAlertingReachable();

  startWorker();
  startBacklogMonitor();

  console.info(
    "[worker] Đã khởi động (engine JobQueueSqlEngine trên SQLite, D15)."
  );
}

process.on("unhandledRejection", (reason) => {
  console.error(`[worker] Unhandled rejection: ${readErrorMessage(reason)}`);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(`[worker] Uncaught exception: ${readErrorMessage(error)}`);
  process.exit(1);
});

try {
  main();
} catch (error) {
  console.error(`[worker] Khởi động thất bại: ${readErrorMessage(error)}`);
  process.exit(1);
}
