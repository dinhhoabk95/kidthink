/**
 * Giả lập `alarm()` của Durable Object bằng `setTimeout` (D15). Cùng hợp đồng
 * `getAlarm`/`setAlarm` mà hai engine dùng; khi nổ, alarm tự xoá rồi gọi `onFire`.
 * Timer `unref` để không giữ tiến trình sống.
 */
export interface TimerAlarmStorage {
  /** Huỷ alarm đang chờ (khi đóng runtime). */
  cancel(): void;
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTimeMs: number): Promise<void>;
}

export function createTimerAlarmStorage(
  onFire: () => Promise<unknown>,
  onError: (error: Error) => void = (error) =>
    console.error(`[local-runtime] alarm failed: ${error.message}`)
): TimerAlarmStorage {
  let scheduledAtMs: number | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function cancel(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    scheduledAtMs = null;
  }

  return {
    cancel,
    getAlarm: () => Promise.resolve(scheduledAtMs),
    setAlarm(scheduledTimeMs) {
      cancel();
      scheduledAtMs = scheduledTimeMs;
      // Giới hạn trần 2^31-1 ms của setTimeout; engine hẹn tối đa vài giờ nên không chạm.
      const delay = Math.max(0, scheduledTimeMs - Date.now());
      timer = setTimeout(() => {
        timer = undefined;
        scheduledAtMs = null;
        onFire().catch((error: Error) => onError(error));
      }, delay);
      timer.unref();
      return Promise.resolve();
    },
  };
}
