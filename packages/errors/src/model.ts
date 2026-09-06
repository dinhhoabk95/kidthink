/**
 * Lớp exception gắn với model — cùng tư tưởng `ModelNotFoundException` và
 * `ValidationException` của Laravel: tầng service ném lỗi **domain**, không dựng
 * response. `AppError` đã là H3Error hạng nhất nên handler chung render, route
 * ❌ NEVER try/catch để chuyển lỗi domain sang lỗi HTTP.
 */

import { AppError, type ErrorDetails, type JsonValue } from "./base.ts";

const NOT_FOUND_STATUS = 404;
const VALIDATION_STATUS = 422;

/**
 * Một trường không hợp lệ — hình dạng `details.fields[]` của ERROR-CODES §7.7.
 *
 * `type` chứ ❌ NEVER `interface`: xem ghi chú ở `ErrorDetails` (base.ts).
 */
// biome-ignore lint/style/useConsistentTypeDefinitions: phải là type để thoả ràng buộc ErrorDetails
export type ValidationFieldError = {
  readonly path: string;
  readonly message: string;
};

// biome-ignore lint/style/useConsistentTypeDefinitions: phải là type để thoả ràng buộc ErrorDetails
export type ValidationDetails = {
  readonly fields: readonly ValidationFieldError[];
};

/**
 * Lỗi validate dữ liệu vào. Tương đương `ValidationException` của Laravel.
 *
 * Body luôn là `details.fields[]` — đúng một hình dạng cho mọi route, để client
 * có một đường xử lý duy nhất (ERROR-CODES §7.7).
 *
 * Cố ý KHÔNG nhận `ZodError`: package này không phụ thuộc zod. Bộ chuyển từ
 * `ZodError` sang `fields[]` nằm ở tầng app
 * (`apps/web/server/utils/api-error.ts`).
 */
export class ValidationError extends AppError<ValidationDetails> {
  readonly fields: readonly ValidationFieldError[];

  constructor(
    fields: readonly ValidationFieldError[],
    message = "Dữ liệu yêu cầu không hợp lệ."
  ) {
    super({
      code: "VALIDATION_FAILED",
      message,
      status: VALIDATION_STATUS,
      details: { fields },
      name: "ValidationError",
    });
    this.fields = fields;
  }

  /** Lỗi một trường — dùng cho ràng buộc nghiệp vụ ngoài schema. */
  static field(path: string, message: string): ValidationError {
    return new ValidationError([{ path, message }]);
  }
}

export interface ModelNotFoundInit<D extends JsonValue> {
  readonly model: string;
  readonly message: string;
  /** Bỏ trống → `NOT_FOUND`. Khai khi model có mã riêng (`SESSION_NOT_FOUND`). */
  readonly code?: string;
  readonly key?: string | number;
  readonly details?: D;
  readonly name?: string;
}

/**
 * Không tìm thấy record, hoặc record không thuộc caller.
 *
 * `model` và `key` chỉ để **log phía server**. ERROR-CODES `BR-ERR-03` cấm tên
 * bảng và id nội bộ xuất hiện trong body, nên hai trường này ❌ NEVER được đưa
 * vào `details` — chúng nằm ngoài `toResponse()`.
 *
 * `BR-ERR-05`: record của người khác cũng trả về lớp này (404), không phải
 * FORBIDDEN — 403 xác nhận record tồn tại.
 */
export class ModelNotFoundError<
  D extends JsonValue = ErrorDetails,
> extends AppError<D> {
  readonly model: string;
  readonly key?: string | number;

  constructor(init: ModelNotFoundInit<D>) {
    super({
      code: init.code ?? "NOT_FOUND",
      message: init.message,
      status: NOT_FOUND_STATUS,
      details: init.details,
      name: init.name ?? "ModelNotFoundError",
    });
    this.model = init.model;
    this.key = init.key;
  }
}

/** Lỗi gắn với một model — mang ngữ cảnh chỉ dành cho log phía server. */
export interface ModelBoundError {
  readonly model: string;
  readonly key?: string | number;
}

export function isModelBoundError(error: unknown): error is ModelBoundError {
  return error instanceof ModelNotFoundError;
}

/**
 * Ngữ cảnh log cho lỗi gắn model. Handler chung ghi cái này ra log server và
 * ❌ NEVER đưa vào body response (ERROR-CODES `BR-ERR-03`).
 */
export function modelErrorContext(
  error: ModelBoundError
): Readonly<Record<string, JsonValue>> {
  return { model: error.model, key: error.key ?? null };
}

export interface ModelNotFoundConstructor {
  new (key?: string | number): ModelNotFoundError;
  readonly model: string;
  readonly code: string;
  readonly defaultMessage: string;
}

/**
 * Sinh lớp not-found cho một model. Các lớp con chỉ khác nhau ở (model, mã,
 * thông báo), nên factory là chỗ duy nhất giữ bộ ba đó — thông báo tiếng Việt
 * từng bị gõ lại ở hàng chục lời gọi `appError("NOT_FOUND", "…")`.
 *
 * ❌ NEVER viết `class X extends ModelNotFoundError` thủ công.
 */
export function defineModelNotFound(
  className: string,
  model: string,
  message: string,
  code = "NOT_FOUND"
): ModelNotFoundConstructor {
  class ModelError extends ModelNotFoundError {
    static readonly model = model;
    static readonly code = code;
    static readonly defaultMessage = message;

    constructor(key?: string | number) {
      super({ model, message, code, key, name: className });
    }
  }

  Object.defineProperty(ModelError, "name", { value: className });
  return ModelError;
}
