/**
 * @deprecated Shim tương thích. Lớp lỗi thật đã chuyển sang `@mindkid/errors`,
 * chia theo domain (`auth`, `billing`, `play`, `content`, …).
 *
 * File này tồn tại để 272 lời gọi `appError("MÃ")` và 47 lời gọi
 * `new AppError("MÃ")` hiện có không phải sửa trong cùng một đợt. Mã mới ❌ NEVER
 * dùng đường này — ném thẳng lớp domain:
 *
 * ```ts
 * // ĐÚNG
 * import { TierLockedError } from "@mindkid/errors";
 * throw new TierLockedError({ access_tier: "premium" });
 *
 * // Cũ, đang gỡ dần
 * throw appError("TIER_LOCKED", { access_tier: "premium" });
 * ```
 */

import {
  type ApiErrorBody,
  AppError as BaseAppError,
  ERROR_CODES,
  type ErrorCode,
  type ErrorDetails,
} from "@mindkid/errors";
import { ERROR_REGISTRY } from "@mindkid/errors/registry";

const UNREGISTERED_CODE_STATUS = 500;
const FALLBACK_MESSAGE = "Đã xảy ra lỗi.";

export type AuthErrorCode = ErrorCode;

/**
 * Hình dạng details cũ: hoặc object, hoặc **một chuỗi** — chuỗi khi ấy vừa làm
 * thông báo vừa lọt vào body. Hành vi kỳ nhưng đã ship, nên shim giữ nguyên;
 * lớp domain mới chỉ nhận object.
 */
export type AuthErrorDetails = ErrorDetails | string;
export type AuthErrorResponse = ApiErrorBody<ErrorDetails | string>;

export interface AuthErrorDefinition {
  readonly status: number;
  readonly message: string;
}

function buildDefinitions(): Record<ErrorCode, AuthErrorDefinition> {
  const entries = ERROR_CODES.map((code) => {
    const definition = ERROR_REGISTRY.get(code);
    if (!definition) {
      throw new Error(`Registry thiếu mã ${code} mà ERROR_CODES có khai`);
    }
    return [
      code,
      { status: definition.status, message: definition.message },
    ] as const;
  });
  // `as` ở đây không nói dối: vòng lặp trên đã ném nếu thiếu bất kỳ mã nào,
  // nên object dựng ra phủ đúng union `ErrorCode`.
  return Object.fromEntries(entries) as Record<ErrorCode, AuthErrorDefinition>;
}

/** @deprecated Dùng `ERROR_REGISTRY` của `@mindkid/errors/registry`. */
export const AUTH_ERROR_DEFINITIONS: Readonly<
  Record<ErrorCode, AuthErrorDefinition>
> = buildDefinitions();

/** @deprecated Ném lớp domain của `@mindkid/errors`. */
export class AppError extends BaseAppError<ErrorDetails | string> {
  /**
   * ⚠️ Trong lúc di trú, `err instanceof AppError` phải bắt được **cả** lỗi cũ
   * dựng qua `appError()` **lẫn** lớp domain mới. Không có dòng này, 9 guard
   * đang chạy (`server/utils/auth-runtime.ts`, `middleware/consent-gate.ts`, …)
   * sẽ lặng lẽ bỏ sót lớp mới và trả 500 thay vì status đúng — lỗi im lặng,
   * không cổng nào bắt được.
   *
   * ❌ NEVER gỡ dòng này trước khi mọi guard đã chuyển sang `isAppError()`.
   */
  static override [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof BaseAppError;
  }

  constructor(code: AuthErrorCode, details?: AuthErrorDetails) {
    const definition = ERROR_REGISTRY.get(code);
    super({
      code,
      message:
        typeof details === "string"
          ? details
          : (definition?.message ?? FALLBACK_MESSAGE),
      status: definition?.status ?? UNREGISTERED_CODE_STATUS,
      details,
      name: "AppError",
    });
  }
}

/** @deprecated Ném lớp domain của `@mindkid/errors`. */
export function appError(
  code: AuthErrorCode,
  details?: AuthErrorDetails
): AppError {
  return new AppError(code, details);
}
