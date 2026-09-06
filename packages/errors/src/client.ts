import type { JsonValue } from "./base.ts";

// biome-ignore lint/style/useConsistentTypeDefinitions: type alias để thoả ràng buộc JsonValue
export type ApiErrorField = {
  readonly field: string;
  readonly message: string;
};

// biome-ignore lint/style/useConsistentTypeDefinitions: type alias để thoả ràng buộc JsonValue
export type ApiErrorDetails = {
  readonly fields?: readonly ApiErrorField[];
  readonly retry_after_s?: number;
  readonly return_level_code?: string;
  readonly [key: string]: JsonValue | undefined;
};

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: ApiErrorDetails;

  constructor(init: {
    readonly code: string;
    readonly message: string;
    readonly statusCode: number;
    readonly details?: ApiErrorDetails;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.statusCode = init.statusCode;
    this.details = init.details;
  }
}

const FALLBACK_ERROR_MESSAGE = "Đã xảy ra lỗi trong quá trình xử lý.";
const NETWORK_ERROR_MESSAGE =
  "Không thể kết nối tới máy chủ. Vui lòng kiểm tra đường truyền mạng.";

function readProperty(target: object, key: string): unknown {
  return Reflect.get(target, key);
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStatusCode(error: Record<string, unknown>): number {
  const statusVal = readProperty(error, "status");
  if (typeof statusVal === "number") {
    return statusVal;
  }
  const statusCodeVal = readProperty(error, "statusCode");
  if (typeof statusCodeVal === "number") {
    return statusCodeVal;
  }
  return 0;
}

function parseDataPayload(data: unknown, statusCode: number): ApiError | null {
  if (!isRecordObject(data)) {
    return null;
  }
  const codeVal = readProperty(data, "code");
  if (typeof codeVal !== "string") {
    return null;
  }

  const messageVal = readProperty(data, "message");
  const message =
    typeof messageVal === "string" && messageVal.length > 0
      ? messageVal
      : FALLBACK_ERROR_MESSAGE;

  const detailsVal = readProperty(data, "details");
  const details = isRecordObject(detailsVal)
    ? (detailsVal as ApiErrorDetails)
    : undefined;

  return new ApiError({
    code: codeVal,
    message,
    statusCode: statusCode || 400,
    details,
  });
}

function isNetworkErrorLike(
  statusCode: number,
  errName: unknown,
  errMessage: unknown
): boolean {
  if (statusCode === 0 || errName === "FetchError") {
    return true;
  }
  if (typeof errMessage === "string") {
    return (
      errMessage.includes("Failed to fetch") ||
      errMessage.includes("NetworkError") ||
      errMessage.includes("network error")
    );
  }
  return false;
}

/**
 * Chuẩn hóa mọi đối tượng lỗi (FetchError, Error, object lạ) về ApiError.
 * Lỗi mạng hoặc không parse được → `code: "NETWORK_ERROR"`, mã client-only.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isRecordObject(error)) {
    const statusCode = readStatusCode(error);
    const data = readProperty(error, "data");
    const parsedDataError = parseDataPayload(data, statusCode);
    if (parsedDataError) {
      return parsedDataError;
    }

    const errMessage = readProperty(error, "message");
    const errName = readProperty(error, "name");
    if (isNetworkErrorLike(statusCode, errName, errMessage)) {
      return new ApiError({
        code: "NETWORK_ERROR",
        message: NETWORK_ERROR_MESSAGE,
        statusCode: 0,
      });
    }

    if (typeof errMessage === "string" && errMessage.length > 0) {
      return new ApiError({
        code: "INTERNAL_ERROR",
        message: errMessage,
        statusCode: statusCode || 500,
      });
    }
  }

  return new ApiError({
    code: "NETWORK_ERROR",
    message: NETWORK_ERROR_MESSAGE,
    statusCode: 0,
  });
}

/**
 * Kiểm tra xem lỗi có phải ApiError không, tuỳ chọn lọc theo mã.
 */
export function isApiError(error: unknown, code?: string): error is ApiError {
  if (error instanceof ApiError) {
    return code === undefined || error.code === code;
  }
  if (isRecordObject(error)) {
    const codeVal = readProperty(error, "code");
    const messageVal = readProperty(error, "message");
    if (typeof codeVal === "string" && typeof messageVal === "string") {
      return code === undefined || codeVal === code;
    }
  }
  return false;
}

/**
 * Trích xuất danh sách lỗi validation theo trường từ response lỗi.
 */
export function getFieldErrors(error: unknown): readonly ApiErrorField[] {
  const normalized = normalizeApiError(error);
  const fields = normalized.details?.fields;
  if (Array.isArray(fields)) {
    const result: ApiErrorField[] = [];
    for (const item of fields) {
      if (isRecordObject(item)) {
        const fieldVal = readProperty(item, "field");
        const messageVal = readProperty(item, "message");
        if (typeof fieldVal === "string" && typeof messageVal === "string") {
          result.push({ field: fieldVal, message: messageVal });
        }
      }
    }
    return result;
  }
  return [];
}
