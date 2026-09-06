/**
 * Base exception của tầng API — cấu trúc dữ liệu lỗi dùng chung cho mọi domain.
 *
 * Cùng tư tưởng `HttpException` của Laravel: lỗi domain tự khai HTTP surface của
 * nó, handler chung chỉ việc render. File domain (`src/domains/*.ts`) khai
 * **mã, status và thông báo**; file này khai **hình dạng**.
 *
 * ❌ NEVER import h3, zod, hay bất kỳ package nào của repo vào đây. Zero
 * dependency là điều kiện để cùng một lớp lỗi dùng được ở server lẫn trong
 * bundle client (`./client`).
 */

/**
 * Giá trị JSON — dùng thay `unknown` để `details` vẫn là kiểu thật.
 *
 * Thuộc tính object cho phép `undefined` vì đó đúng là ngữ nghĩa JSON:
 * `JSON.stringify` **bỏ hẳn khoá** có giá trị `undefined`. Body lỗi đang chạy đã
 * dựa vào điều đó (`purge_at: user.purgeAt?.toISOString()` ở luồng OAuth), nên
 * cấm `undefined` ở đây là bắt đổi response chứ không phải bắt đúng kiểu.
 * ❌ NEVER cho `undefined` vào chính `JsonValue` — chỉ ở vị trí giá trị thuộc tính.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

/**
 * Hình dạng `details` của một lỗi. Mỗi lớp domain hẹp kiểu này lại thành payload
 * riêng của nó (ví dụ `RateLimitedError` chỉ nhận `{ retry_after_s: number }`),
 * ❌ NEVER để trống ở `Record<string, unknown>` — type-safety.md cấm `unknown` mới.
 *
 * Phải là `type`, ❌ NEVER đổi sang `interface`: chỉ type alias mới nhận index
 * signature ngầm, nên `interface X { fields: … }` KHÔNG thoả ràng buộc này còn
 * `type X = { fields: … }` thì có. Đã đo bằng `A extends ErrorDetails`.
 */
// biome-ignore lint/style/useConsistentTypeDefinitions: interface không có index signature ngầm nên không thoả ràng buộc JsonValue
export type ErrorDetails = { readonly [key: string]: JsonValue | undefined };

/** Body lỗi trả về client — ERROR-CODES §7.1. Đúng ba trường, không hơn. */
export interface ApiErrorBody<D extends JsonValue = ErrorDetails> {
  readonly code: string;
  readonly message: string;
  readonly details?: D;
}

/**
 * Status mặc định khi lớp domain không khai gì — mã chung cho lỗi nghiệp vụ.
 *
 * 400 chứ không phải 500: lỗi không khai status là lỗi *đầu vào* chưa được phân
 * loại kỹ, không phải sự cố hệ thống. Trả 500 cho nó sẽ bơm nhiễu vào cảnh báo
 * 5xx và làm client tưởng thử lại được.
 */
export const DEFAULT_ERROR_STATUS = 400;

export interface AppErrorInit<D extends JsonValue> {
  readonly code: string;
  readonly message: string;
  readonly status?: number;
  readonly details?: D;
  readonly name?: string;
}

export abstract class AppError<
  D extends JsonValue = ErrorDetails,
> extends Error {
  /**
   * h3 v1 nhận diện lỗi HTTP bằng duck-type `constructor.__h3_error__`
   * (`isError()` trong h3/dist/index.mjs). Khai cờ này cùng ba getter
   * `statusCode` / `statusMessage` / `data` làm `AppError` trở thành H3Error
   * hạng nhất: `throw` ở bất kỳ tầng nào — service, guard, route — đều được
   * Nitro trả về đúng status và đúng body mà route KHÔNG phải try/catch.
   *
   * Đây là toàn bộ chỗ package này biết tới giao thức h3 — một tên thuộc tính,
   * không import h3. ❌ NEVER thêm phụ thuộc h3 vào package này.
   */
  static readonly __h3_error__ = true;

  readonly code: string;
  readonly status: number;
  readonly details?: D;

  protected constructor(init: AppErrorInit<D>) {
    super(init.message);
    this.code = init.code;
    this.status = init.status ?? DEFAULT_ERROR_STATUS;
    this.details = init.details;
    this.name = init.name ?? new.target.name;
  }

  /** Surface H3Error: HTTP status của mã lỗi. */
  get statusCode(): number {
    return this.status;
  }

  /**
   * Surface H3Error: `statusMessage` là **mã lỗi**, không phải thông báo.
   * ERROR-CODES `BR-ERR-06` — client bắt theo mã, không theo chuỗi; chuỗi tiếng
   * Việt đổi được cho UX, mã thì bất biến. h3 cũng sanitize `statusMessage`,
   * nên đặt chuỗi tiếng Việt vào đó là sai chỗ.
   */
  get statusMessage(): string {
    return this.code;
  }

  /** Surface H3Error: body lỗi theo ERROR-CODES §7.1. */
  get data(): ApiErrorBody<D> {
    return this.toResponse();
  }

  toResponse(): ApiErrorBody<D> {
    if (this.details === undefined) {
      return { code: this.code, message: this.message };
    }
    return { code: this.code, message: this.message, details: this.details };
  }
}

/** Nhận diện lỗi domain qua ranh giới package/bundle. */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

const CODE_WORD_SEPARATOR = /_/g;

/** `RATE_LIMITED` → `RateLimitedError`. Tên lớp để đọc được trong log. */
export function classNameFromCode(code: string): string {
  const pascal = code
    .toLowerCase()
    .split(CODE_WORD_SEPARATOR)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return pascal.endsWith("Error") ? pascal : `${pascal}Error`;
}

export interface ErrorSpec {
  readonly code: string;
  readonly message: string;
  /** Bỏ trống → `DEFAULT_ERROR_STATUS` (400). Chỉ khai khi khác 400. */
  readonly status?: number;
  /** Bỏ trống → suy từ `code`. Khai khi muốn tên lớp khác quy tắc. */
  readonly className?: string;
}

export interface AppErrorCause<D> {
  readonly cause?: D;
}

export interface AppErrorConstructor<D extends JsonValue> {
  new (details?: D, messageOverride?: string): AppError<D>;
  new (message: string, detailsOrOptions?: D | AppErrorCause<D>): AppError<D>;
  new (arg1?: D | string, arg2?: D | AppErrorCause<D> | string): AppError<D>;
  readonly code: string;
  readonly status: number;
  readonly defaultMessage: string;
  readonly __h3_error__: boolean;
}

function extractDetails<D>(value: unknown): D | undefined {
  if (value && typeof value === "object") {
    return (
      "cause" in value && value.cause !== undefined ? value.cause : value
    ) as D;
  }
  return undefined;
}

function resolveErrorArgs<D>(
  defaultMessage: string,
  arg1?: D | string,
  arg2?: D | { readonly cause?: D } | string
): { readonly details: D | undefined; readonly message: string } {
  if (typeof arg1 === "string") {
    return {
      message: arg1,
      details: extractDetails<D>(arg2),
    };
  }

  if (arg1 && typeof arg1 === "object") {
    return {
      details: extractDetails<D>(arg1),
      message: typeof arg2 === "string" ? arg2 : defaultMessage,
    };
  }

  return {
    message: typeof arg2 === "string" ? arg2 : defaultMessage,
    details: extractDetails<D>(arg2),
  };
}

/**
 * Sinh một lớp exception từ đặc tả. Đây là **cách duy nhất** khai mã lỗi mới:
 * cặp (mã, status, thông báo) chỉ tồn tại một chỗ, nên không có đường nào để
 * hai route gõ lại hai thông báo khác nhau cho cùng một mã.
 *
 * ❌ NEVER viết `class X extends AppError` thủ công trong file domain.
 */
export function defineError<D extends JsonValue = ErrorDetails>(
  spec: ErrorSpec
): AppErrorConstructor<D> {
  const status = spec.status ?? DEFAULT_ERROR_STATUS;
  const className = spec.className ?? classNameFromCode(spec.code);

  class DomainError extends AppError<D> {
    static readonly code = spec.code;
    static readonly status = status;
    static readonly defaultMessage = spec.message;

    constructor(arg1?: D | string, arg2?: D | { readonly cause?: D } | string) {
      const resolved = resolveErrorArgs<D>(spec.message, arg1, arg2);
      super({
        code: spec.code,
        message: resolved.message,
        status,
        details: resolved.details,
        name: className,
      });
    }
  }

  Object.defineProperty(DomainError, "name", { value: className });
  return DomainError;
}
