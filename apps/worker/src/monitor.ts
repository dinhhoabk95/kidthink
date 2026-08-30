import { alert, getFailedCount, getWaitingCount } from "@mindkid/queue";
import { readErrorMessage } from "./errors.js";

/**
 * `BR-JOB-03` — backlog vượt ngưỡng thì alert **tới người**.
 *
 * `job-queue.md` §1 gọi worker chết im lặng là "chế độ hỏng tệ nhất" và §7.3
 * đặt ngưỡng cụ thể, `infra/monitoring/alerts.yml:85` cấu hình cảnh báo
 * "> 500 jobs in 5m" — nhưng chưa có gì đo. `getWaitingCount()` được gọi đúng
 * một lần ở health check rồi **vứt giá trị**, và `getFailedCount` là export
 * chết không ai gọi.
 *
 * Đây không phải HTTP endpoint, nên không đụng `BR-JOB-04` ("`apps/worker`
 * Cấm — NEVER expose HTTP").
 */

/** §7.3 — Backlog `waiting` > 500 trong 5 phút. */
const WAITING_THRESHOLD = 500;
const WAITING_SUSTAINED_MS = 5 * 60 * 1000;

/** §7.3 — Job `failed` > 10 trong 1 giờ. */
const FAILED_THRESHOLD = 10;
const FAILED_WINDOW_MS = 60 * 60 * 1000;

const SAMPLE_INTERVAL_MS = 60 * 1000;

export interface MonitorState {
  /** Thời điểm backlog bắt đầu vượt ngưỡng; `undefined` khi đang dưới ngưỡng. */
  waitingHighSince?: number;
  /** Mốc đếm `failed` của cửa sổ một giờ hiện tại. */
  failedWindowStart: number;
  /**
   * Số `failed` tại đầu cửa sổ — `undefined` cho tới khi đo được mẫu đầu tiên.
   *
   * Cấm — NEVER gieo bằng `0`. `getFailedCount()` trả tổng **trọn đời** của
   * queue, nên so nó với 0 là báo "vượt ngưỡng" ngay tick đầu tiên sau mỗi lần
   * khởi động lại, mãi mãi. Mốc thật chỉ biết được sau khi đã đọc một lần.
   */
  failedAtWindowStart?: number;
}

/** Trạng thái lúc worker vừa lên: có mốc thời gian, chưa có mốc số đếm. */
export function initialMonitorState(now = Date.now()): MonitorState {
  return { failedWindowStart: now };
}

export async function checkQueueHealth(
  state: MonitorState,
  now = Date.now()
): Promise<MonitorState> {
  const [waiting, failed] = await Promise.all([
    getWaitingCount(),
    getFailedCount(),
  ]);

  let waitingHighSince = state.waitingHighSince;
  if (waiting > WAITING_THRESHOLD) {
    waitingHighSince ??= now;
    if (now - waitingHighSince >= WAITING_SUSTAINED_MS) {
      await alert(
        "critical",
        "Hàng đợi worker tồn đọng vượt ngưỡng",
        {
          waiting,
          threshold: WAITING_THRESHOLD,
          sustainedMs: now - waitingHighSince,
        },
        "https://docs.tinimath.vn/runbooks/worker-backlog"
      );
      waitingHighSince = now;
    }
  } else {
    waitingHighSince = undefined;
  }

  let { failedWindowStart, failedAtWindowStart } = state;
  if (failedAtWindowStart === undefined) {
    // Mẫu đầu tiên chỉ đặt mốc. Không có nhánh này thì mọi lần deploy đều phát
    // một alert backlog giả với `failedInWindow` bằng tổng trọn đời.
    failedWindowStart = now;
    failedAtWindowStart = failed;
  } else if (now - failedWindowStart >= FAILED_WINDOW_MS) {
    failedWindowStart = now;
    failedAtWindowStart = failed;
  } else if (failed - failedAtWindowStart > FAILED_THRESHOLD) {
    await alert("error", "Tỉ lệ job thất bại vượt ngưỡng", {
      failedInWindow: failed - failedAtWindowStart,
      threshold: FAILED_THRESHOLD,
      windowMs: now - failedWindowStart,
    });
    failedWindowStart = now;
    failedAtWindowStart = failed;
  }

  return { waitingHighSince, failedWindowStart, failedAtWindowStart };
}

export function startBacklogMonitor(): NodeJS.Timeout {
  let state: MonitorState = initialMonitorState();

  const timer = setInterval(() => {
    checkQueueHealth(state)
      .then((next) => {
        state = next;
      })
      .catch((error: unknown) => {
        console.error(
          `[worker] Không đo được sức khoẻ hàng đợi: ${readErrorMessage(error)}`
        );
      });
  }, SAMPLE_INTERVAL_MS);

  timer.unref();
  return timer;
}
