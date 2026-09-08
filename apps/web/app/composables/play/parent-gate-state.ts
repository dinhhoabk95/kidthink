import { computed, onMounted, onUnmounted, ref } from "vue";

const DEFAULT_TRUST_MS = 5 * 60 * 1000;
const LOCK_DURATION_MS = 60 * 1000;
const MAX_ATTEMPTS = 3;

export interface ParentGateStateOptions {
  readonly clientOnly?: boolean;
}

export function useParentGateState(options: ParentGateStateOptions = {}) {
  const prefix = options.clientOnly ? "pg_client" : "pg_server";
  const attemptsKey = `${prefix}_failed_attempts`;
  const lockKey = `${prefix}_lock_until`;
  // Khoá tin cậy PHẢI tách theo mode. Đường `clientOnly` tự sinh đố toán ngay
  // trong browser, nên dùng chung khoá với đường server là để một lần qua cổng
  // ở trang chơi mở luôn cổng của khu phụ huynh.
  const trustKey = `${prefix}_trusted_until`;

  const failedAttempts = ref(0);
  const lockUntil = ref(0);
  const currentTime = ref(Date.now());

  let timerHandle: ReturnType<typeof setInterval> | null = null;

  function syncFromStorage(): void {
    if (typeof window === "undefined") {
      return;
    }
    const storedAttempts = Number(sessionStorage.getItem(attemptsKey) ?? 0);
    const storedLock = Number(sessionStorage.getItem(lockKey) ?? 0);
    failedAttempts.value = Number.isFinite(storedAttempts) ? storedAttempts : 0;
    lockUntil.value = Number.isFinite(storedLock) ? storedLock : 0;
  }

  function syncToStorage(): void {
    if (typeof window === "undefined") {
      return;
    }
    sessionStorage.setItem(attemptsKey, String(failedAttempts.value));
    sessionStorage.setItem(lockKey, String(lockUntil.value));
  }

  const isLocked = computed(() => lockUntil.value > currentTime.value);
  const remainingLockSeconds = computed(() =>
    Math.max(0, Math.ceil((lockUntil.value - currentTime.value) / 1000))
  );

  function isTrusted(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    const trustedUntil = Number(sessionStorage.getItem(trustKey) ?? 0);
    return trustedUntil > Date.now();
  }

  function setTrusted(durationMs = DEFAULT_TRUST_MS): void {
    if (typeof window === "undefined") {
      return;
    }
    sessionStorage.setItem(trustKey, String(Date.now() + durationMs));
  }

  function recordFailedAttempt(): {
    locked: boolean;
    remainingSeconds: number;
  } {
    syncFromStorage();
    failedAttempts.value += 1;
    let locked = false;
    if (failedAttempts.value >= MAX_ATTEMPTS) {
      lockUntil.value = Date.now() + LOCK_DURATION_MS;
      failedAttempts.value = 0;
      locked = true;
    }
    syncToStorage();
    return {
      locked,
      remainingSeconds: Math.ceil(LOCK_DURATION_MS / 1000),
    };
  }

  function recordSuccess(): void {
    failedAttempts.value = 0;
    lockUntil.value = 0;
    syncToStorage();
  }

  onMounted(() => {
    syncFromStorage();
    timerHandle = setInterval(() => {
      currentTime.value = Date.now();
    }, 500);
  });

  onUnmounted(() => {
    if (timerHandle !== null) {
      clearInterval(timerHandle);
    }
  });

  return {
    isLocked,
    remainingLockSeconds,
    failedAttempts,
    isTrusted,
    setTrusted,
    recordFailedAttempt,
    recordSuccess,
  };
}
