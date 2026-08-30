export const DEFAULT_REDIRECT_TARGET = "/me";

export type RedirectTargetInput =
  | string
  | number
  | boolean
  | readonly (string | number | boolean | null | undefined)[]
  | (string | number | boolean | null | undefined)[]
  | null
  | undefined;

function hasControlCharacter(str: string): boolean {
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code <= 31 || code === 127) {
      return true;
    }
  }
  return false;
}

/**
 * BR-LGN-12 & BR-REG-12: Khử độc đích điều hướng sau login / register / profile switch.
 *
 * Chỉ chấp nhận relative path nội bộ:
 * - Bắt đầu bằng `/`
 * - Không bắt đầu bằng `//` (protocol-relative XSS / open redirect)
 * - Không bắt đầu bằng `/\\` (Windows SMB redirect bypass)
 * - Không chứa `/../` hoặc kết thúc bằng `/..` (path traversal)
 * - Không chứa ký tự điều khiển ASCII
 *
 * Mọi trường hợp không đạt chuẩn đều fallback về `fallback` (mặc định `/me`).
 */
export function sanitizeRedirectTarget(
  target: RedirectTargetInput,
  fallback = DEFAULT_REDIRECT_TARGET
): string {
  const candidate = Array.isArray(target) ? target[0] : target;
  if (!candidate || typeof candidate !== "string") {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("/../") ||
    trimmed.endsWith("/..") ||
    trimmed === "/.." ||
    hasControlCharacter(trimmed)
  ) {
    return fallback;
  }

  return trimmed;
}
