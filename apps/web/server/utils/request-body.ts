import { getQuery, type H3Event, readBody } from "h3";
import {
  assertPayloadSize,
  assertRequestBodySize,
  DEFAULT_MAX_JSON_BODY_BYTES as RUNTIME_DEFAULT_MAX_JSON_BODY_BYTES,
} from "./auth-runtime.js";

export const DEFAULT_MAX_JSON_BODY_BYTES = RUNTIME_DEFAULT_MAX_JSON_BODY_BYTES;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonRecord | JsonArray;
export interface JsonRecord {
  [key: string]: JsonValue | undefined;
}
export type JsonArray = JsonValue[];

/**
 * Đọc body request có kiểm tra trần kích thước tối đa.
 * Khuyến khích dùng `defineApiRoute` thay vì gọi thủ công `readBodyWithLimit` hoặc `readRequestBody`.
 */
export async function readBodyWithLimit(
  event: H3Event,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): Promise<Record<string, string | number | boolean | null | object>> {
  assertRequestBodySize(event, maxBytes);
  const body = await readRequestBody(event);
  assertPayloadSize(body, maxBytes);
  if (typeof body === "object" && body !== null) {
    return body as Record<string, string | number | boolean | null | object>;
  }
  return {};
}

/**
 * Đọc JSON body với kiểm tra kích thước nghiêm ngặt hai tầng (header + actual buffer size)
 * chống chunked-encoding payload bypass (SEC-REQ-6).
 */
export async function readJsonBodyWithLimit<T = JsonRecord>(
  event: H3Event,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): Promise<T> {
  assertRequestBodySize(event, maxBytes);
  const parsed =
    (await readBody<JsonRecord>(event).catch(() => undefined)) ??
    (Reflect.get(event, "_body") as JsonRecord | undefined) ??
    (Reflect.get(event.context, "body") as JsonRecord | undefined);

  assertPayloadSize(parsed, maxBytes);
  return (parsed ?? {}) as T;
}

/**
 * Đọc body request rồi trả về dữ liệu thô — **chưa tin được**, người gọi BẮT BUỘC
 * đưa qua Zod (`BR-SEC-04`).
 * Khuyến nghị: dùng `defineApiRoute` cho route mới.
 */
export async function readRequestBody(event: H3Event): Promise<JsonRecord> {
  const parsed = (await readBody<JsonRecord>(event).catch(() => undefined)) as
    | JsonRecord
    | undefined;
  if (isNonEmptyRecord(parsed)) {
    return parsed;
  }

  const injected = Reflect.get(event, "_body") as JsonRecord | undefined;
  if (isNonEmptyRecord(injected)) {
    return injected;
  }

  const contextBody = Reflect.get(event.context, "body") as
    | JsonRecord
    | undefined;
  if (isNonEmptyRecord(contextBody)) {
    return contextBody;
  }

  return parsed ?? {};
}

function isNonEmptyRecord(value: JsonValue | undefined): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

/**
 * Đọc query string, ưu tiên `event._query` mà test đơn vị gắn sẵn.
 */
export function readRequestQuery(event: H3Event): JsonRecord {
  const injected = Reflect.get(event, "_query") as JsonRecord | undefined;
  if (typeof injected === "object" && injected !== null) {
    return injected;
  }
  return getQuery(event) as JsonRecord;
}
