import { type GameSession, TemplateGameSession } from "@mindkid/game-engine";

/** Nhãn a11y của lớp xoay máy — không chữ trên màn, trẻ chưa đọc được (`BR-FBK-12`). */
export const PORTRAIT_GATE_LABEL = "Xoay máy dọc để chơi";

/**
 * Bàn của session có không vừa ở khung ngang hiện tại không (`BR-PSZ-14`).
 * Chỉ `TemplateGameSession` khai `requiresPortrait()`; session khác không bao
 * giờ xin xoay máy.
 */
export function resolveRequiresPortrait(
  session: GameSession | null | undefined
): boolean {
  return session instanceof TemplateGameSession && session.requiresPortrait();
}

/** Sau bấy nhiêu ms vẫn ngang thì lớp thêm dòng nhắc phụ huynh (`BR-PSZ-14`). */
export const PORTRAIT_GATE_PARENT_HINT_DELAY_MS = 5000;

/** Dòng chữ nhỏ cho phụ huynh — trẻ dựa vào icon, không vào dòng này. */
export const PORTRAIT_GATE_PARENT_HINT =
  "Nhờ ba mẹ tắt khoá xoay màn hình của máy";

/** Phần của `screen.orientation` mà shell dùng; trình duyệt thiếu thì `undefined`. */
export interface OrientationApi {
  lock?: (orientation: "portrait") => Promise<void>;
  unlock?: () => void;
}

/** Môi trường tối thiểu để thử khoá hướng — tách khỏi `window` cho dễ test. */
export interface OrientationEnv {
  isFullscreen: boolean;
  isStandalone: boolean;
  orientation: OrientationApi | undefined;
}

/** Đọc môi trường thật của trình duyệt; `undefined` ở SSR. */
export function readOrientationEnv(): OrientationEnv | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return {
    isFullscreen: Boolean(document.fullscreenElement),
    isStandalone: window.matchMedia("(display-mode: standalone)").matches,
    orientation: window.screen?.orientation as OrientationApi | undefined,
  };
}

/**
 * Thử khoá hướng dọc (`BR-PSZ-14`). Chỉ khi trang toàn màn hình hoặc
 * standalone — ngoài hai trường hợp đó trình duyệt từ chối. Lỗi nuốt im: lớp
 * xoay máy vẫn là hành vi nền. Trả `true` khi khoá thành công.
 */
export async function tryLockPortrait(env: OrientationEnv): Promise<boolean> {
  const lock = env.orientation?.lock;
  if (!(lock && (env.isFullscreen || env.isStandalone))) {
    return false;
  }
  try {
    await lock.call(env.orientation, "portrait");
    return true;
  } catch {
    return false;
  }
}

/** Mở khoá khi rời trò; không bao giờ ném. */
export function releaseOrientationLock(env: OrientationEnv): void {
  try {
    env.orientation?.unlock?.();
  } catch {
    // Trình duyệt không cho mở khoá thì bỏ qua — khoá tự hết khi rời trang.
  }
}
