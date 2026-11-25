/**
 * Phân loại kết quả `get-session` (`auth-tokens-sessions.md` bước 6b).
 * 429/5xx/lỗi mạng KHÔNG đồng nghĩa "chưa đăng nhập".
 */
export type SessionProbeStatus = "authenticated" | "anonymous" | "unavailable";

export interface SessionProbeError {
  readonly status?: number;
}

export interface SessionProbeResponse {
  readonly data: object | null;
  readonly error?: SessionProbeError | null;
}

const SERVER_ERROR_FLOOR = 500;
const TOO_MANY_REQUESTS = 429;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

export const SESSION_RETRY_DELAYS_MS: readonly number[] = [400, 1200];
const AUTH_HINT_KEY = "mindkid-auth-hint";
export const AUTH_HINT_TTL_MS = 12 * 60 * 60 * 1000;

export interface HintStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function classifySessionProbe(
  res: SessionProbeResponse | null | undefined
): SessionProbeStatus {
  const status = res?.error?.status;
  if (res?.error) {
    if (status === UNAUTHORIZED || status === FORBIDDEN) {
      return "anonymous";
    }
    if (
      status === undefined ||
      status === 0 ||
      status === TOO_MANY_REQUESTS ||
      status >= SERVER_ERROR_FLOOR
    ) {
      return "unavailable";
    }
    return "anonymous";
  }
  return res?.data ? "authenticated" : "anonymous";
}

function defaultStorage(): HintStorage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function writeAuthHint(
  authenticated: boolean,
  now: number = Date.now(),
  storage: HintStorage | null = defaultStorage()
): void {
  try {
    if (authenticated) {
      storage?.setItem(AUTH_HINT_KEY, String(now));
    } else {
      storage?.removeItem(AUTH_HINT_KEY);
    }
  } catch {
    // Storage bị chặn: bỏ qua, hint chỉ là tiện ích.
  }
}

export function hasAuthHint(
  now: number = Date.now(),
  storage: HintStorage | null = defaultStorage()
): boolean {
  try {
    const raw = storage?.getItem(AUTH_HINT_KEY);
    if (!raw) {
      return false;
    }
    const at = Number(raw);
    return Number.isFinite(at) && now - at < AUTH_HINT_TTL_MS;
  } catch {
    return false;
  }
}

/** Thử lại khi `unavailable`; trả kết quả cuối. */
export async function probeSessionWithBackoff(
  probe: () => Promise<SessionProbeStatus>,
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
  delays: readonly number[] = SESSION_RETRY_DELAYS_MS
): Promise<SessionProbeStatus> {
  let result = await probe();
  for (const delay of delays) {
    if (result !== "unavailable") {
      return result;
    }
    await sleep(delay);
    result = await probe();
  }
  return result;
}
