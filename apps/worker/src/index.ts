import { assertAlertingReachable, syncJobSchedulers } from "@mindkid/queue";
import { readErrorMessage } from "./errors.js";
import { startBacklogMonitor } from "./monitor.js";
import { shutdown, startWorker } from "./worker.js";

/**
 * Bản cũ gọi `setupCronJobs()` mà không `await`, nên mọi lỗi lên lịch bị nuốt,
 * và không có handler nào cho `unhandledRejection` / `uncaughtException` —
 * worker chết là chết im lặng, đúng bài học v1 ở `job-queue.md` §1.
 */
function registerShutdownHandlers(): void {
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      shutdown(signal)
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          console.error(`[worker] Tắt không sạch: ${readErrorMessage(error)}`);
          process.exit(1);
        });
    });
  }
}

async function main(): Promise<void> {
  // Đăng ký trước mọi `await`: nếu đăng ký sau, một SIGTERM tới trong lúc
  // `syncJobSchedulers()` còn chạy sẽ rơi vào hành vi mặc định và giết tiến
  // trình giữa chừng thay vì tắt sạch.
  registerShutdownHandlers();

  // BR-MON-01 — before consuming a single job. This process is the one that
  // runs backups and sweeps; if every alert channel it has is a console.warn,
  // its failures reach nobody, and a backup that fails in silence is the exact
  // v1 outcome backup-and-restore.md §1 exists to prevent.
  assertAlertingReachable();

  startWorker();

  const { upserted, removed } = await syncJobSchedulers();
  console.info(
    `[worker] Lịch chạy: ${upserted.length} job đã đăng ký${
      removed.length > 0 ? `, gỡ ${removed.length} lịch cũ` : ""
    }.`
  );

  startBacklogMonitor();

  console.info("[worker] Đã khởi động.");
}

process.on("unhandledRejection", (reason: unknown) => {
  console.error(`[worker] Unhandled rejection: ${readErrorMessage(reason)}`);
  process.exit(1);
});

process.on("uncaughtException", (error: unknown) => {
  console.error(`[worker] Uncaught exception: ${readErrorMessage(error)}`);
  process.exit(1);
});

main().catch((error: unknown) => {
  console.error(`[worker] Khởi động thất bại: ${readErrorMessage(error)}`);
  process.exit(1);
});
