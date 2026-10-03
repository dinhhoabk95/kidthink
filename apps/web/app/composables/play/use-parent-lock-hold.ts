import { onUnmounted, type Ref, ref } from "vue";

/** Giữ đủ lâu mới mở cổng phụ huynh — chạm lướt của trẻ không mở được (`BR-PGT-01`). */
export const PARENT_LOCK_HOLD_MS = 800;
const TICK_MS = 40;
const FULL_PROGRESS = 100;

export interface ParentLockHold {
  /** 0–100, vẽ vòng tiến độ quanh nút khoá. */
  readonly progress: Ref<number>;
  readonly start: () => void;
  readonly cancel: () => void;
}

/**
 * Nút khoá phụ huynh nhấn giữ của bề mặt trẻ. Dùng chung cho trang chơi level
 * và trang bài học để hai trang không lệch nhau về thời gian giữ.
 */
export function useParentLockHold(onUnlock: () => void): ParentLockHold {
  const progress = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  function stopTimer(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function cancel(): void {
    stopTimer();
    progress.value = 0;
  }

  function start(): void {
    stopTimer();
    progress.value = 0;
    const startedAt = Date.now();
    timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      progress.value = Math.min(
        FULL_PROGRESS,
        Math.round((elapsed / PARENT_LOCK_HOLD_MS) * FULL_PROGRESS)
      );
      if (progress.value >= FULL_PROGRESS) {
        cancel();
        onUnlock();
      }
    }, TICK_MS);
  }

  onUnmounted(stopTimer);

  return { progress, start, cancel };
}
