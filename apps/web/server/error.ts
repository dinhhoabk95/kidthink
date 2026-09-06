import {
  type ApiErrorBody,
  type AppError,
  isAppError,
  isModelBoundError,
  modelErrorContext,
} from "@mindkid/errors";
import { getRequestURL, send, setResponseHeaders, setResponseStatus } from "h3";
import type { NitroErrorHandler } from "nitropack";
import { readPostgresErrorCode } from "#server/utils/pg-error";

/**
 * Handler lỗi chung của tầng API — chỗ **duy nhất** dựng body lỗi, theo
 * ERROR-CODES §4 và §8: "Handler ném lỗi kèm mã. Middleware bắt, tra bảng §7
 * để lấy HTTP status. Dựng body §7.1."
 *
 * Vì `AppError` là H3Error hạng nhất (xem `packages/errors/src/base.ts`), route
 * chỉ cần ném lớp exception theo domain hoặc model — ❌ NEVER
 * bọc try/catch để chuyển lỗi domain sang lỗi HTTP.
 *
 * Nitro chạy `errorHandler` theo **chuỗi** và nối handler mặc định vào cuối,
 * dừng khi `event.handled`. Handler này cố ý chỉ nhận `/api/*` rồi return sớm
 * cho mọi đường khác, để trang lỗi Nuxt (SSR, 404 trang) giữ nguyên hành vi
 * hiện tại. ❌ NEVER bỏ điều kiện đường dẫn đó.
 */

/** Header bảo vệ trang lỗi — giữ đúng bộ mà handler mặc định của Nitro đặt. */
const ERROR_HEADERS: Readonly<Record<string, string>> = {
  "content-type": "application/json",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "content-security-policy": "script-src 'none'; frame-ancestors 'none';",
  "cache-control": "no-cache",
};

const ERROR_CODE_TEXT = /^[A-Z][A-Z0-9_]*$/;
const SERVER_ERROR_STATUS = 500;
const PG_UNIQUE_VIOLATION = "23505";

/** Thông báo chung cho lỗi 5xx — ❌ NEVER lộ chi tiết nội bộ (`BR-ERR-03`). */
const INTERNAL_ERROR_BODY: ApiErrorBody = {
  code: "INTERNAL_ERROR",
  message: "Hệ thống gặp sự cố. Vui lòng thử lại sau ít phút.",
};

interface ErrorObjectLike {
  readonly statusCode?: number;
  readonly statusMessage?: string;
  readonly message?: string;
  readonly code?: string;
  readonly data?: ApiErrorBody;
  readonly unhandled?: boolean;
  readonly fatal?: boolean;
  readonly cause?: unknown;
}

function isErrorObject(value: unknown): value is ErrorObjectLike {
  return typeof value === "object" && value !== null;
}

/** Lỗi domain có thể nằm ở chính error, hoặc ở `cause` khi h3 đã bọc lại. */
function resolveAppError(error: unknown): AppError | null {
  if (isAppError(error)) {
    return error;
  }
  if (isErrorObject(error) && isAppError(error.cause)) {
    return error.cause;
  }
  return null;
}

/**
 * Map lỗi Postgres qua `readPostgresErrorCode` → mã nghiệp vụ.
 * ❌ NEVER lộ tên constraint, tên bảng hay stack trace (`BR-ERR-03`).
 */
function mapPostgresError(
  error: unknown
): { statusCode: number; body: ApiErrorBody } | null {
  const code = readPostgresErrorCode(error);
  if (code === PG_UNIQUE_VIOLATION) {
    return {
      statusCode: 409,
      body: {
        code: "CODE_ALREADY_EXISTS",
        message: "Dữ liệu hoặc mã đã tồn tại trong hệ thống.",
      },
    };
  }
  return null;
}

/**
 * Body §7.1 cho lỗi h3 thường (`createError({ statusMessage: "SOME_CODE" })`).
 * Nhiều route vẫn dựng lỗi kiểu này; chúng cũng phải ra đúng một hình dạng.
 */
function bodyFromH3Error(
  error: ErrorObjectLike,
  statusCode: number
): ApiErrorBody {
  if (statusCode >= SERVER_ERROR_STATUS) {
    return INTERNAL_ERROR_BODY;
  }

  const data = error.data;
  if (
    isErrorObject(data) &&
    typeof data.code === "string" &&
    typeof data.message === "string"
  ) {
    return data;
  }

  const statusMessage = error.statusMessage;
  const code =
    typeof statusMessage === "string" && ERROR_CODE_TEXT.test(statusMessage)
      ? statusMessage
      : "INTERNAL_ERROR";
  const message =
    typeof error.message === "string" && error.message.length > 0
      ? error.message
      : INTERNAL_ERROR_BODY.message;

  console.warn(
    "[api error:fallback-guess] Cảnh báo mức cao: Tuyến API ném H3Error trần cần đoán mã (chưa di trú sang @mindkid/errors):",
    { statusCode, statusMessage, code, message }
  );

  return { code, message };
}

/**
 * Log phía server: đầy đủ ngữ cảnh (ERROR-CODES §4 bước 4). Chỉ log lỗi 5xx và
 * lỗi chưa xử lý — lỗi 4xx là hành vi bình thường của client, log hết thì mất
 * tín hiệu.
 */
function logServerSide(
  error: unknown,
  statusCode: number,
  method: string,
  url: string
): void {
  const isUnhandled =
    isErrorObject(error) && (error.unhandled === true || error.fatal === true);
  if (statusCode < SERVER_ERROR_STATUS && !isUnhandled) {
    return;
  }

  const context: Record<string, string | number> = { method, url, statusCode };
  if (isModelBoundError(error)) {
    const modelContext = modelErrorContext(error);
    if (typeof modelContext.model === "string") {
      context.model = modelContext.model;
    }
    if (
      typeof modelContext.key === "string" ||
      typeof modelContext.key === "number"
    ) {
      context.key = modelContext.key;
    }
  }
  console.error("[api error]", context, error);
}

const errorHandler: NitroErrorHandler = (error, event) => {
  const url = getRequestURL(event, {
    xForwardedHost: true,
    xForwardedProto: true,
  });

  // Không phải API → nhường handler mặc định của Nitro (trang lỗi Nuxt).
  if (!url.pathname.startsWith("/api/")) {
    return;
  }

  const appError = resolveAppError(error);
  const pgMapped = appError ? null : mapPostgresError(error);

  const statusCode =
    appError?.status ??
    pgMapped?.statusCode ??
    (isErrorObject(error) && typeof error.statusCode === "number"
      ? error.statusCode
      : SERVER_ERROR_STATUS);

  logServerSide(appError ?? error, statusCode, event.method ?? "GET", url.href);

  let body: ApiErrorBody;
  if (appError && statusCode < SERVER_ERROR_STATUS) {
    body = appError.toResponse();
  } else if (pgMapped) {
    body = pgMapped.body;
  } else {
    body = bodyFromH3Error(isErrorObject(error) ? error : {}, statusCode);
  }

  setResponseHeaders(event, { ...ERROR_HEADERS });
  setResponseStatus(event, statusCode, body.code);
  return send(event, JSON.stringify(body));
};

export default errorHandler;
