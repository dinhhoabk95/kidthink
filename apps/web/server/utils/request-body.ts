import { getQuery, type H3Event, readBody } from "h3";
import { assertRequestBodySize } from "./auth-runtime-factory.js";

/**
 * Đọc body request có kiểm tra trần kích thước tối đa.
 * Khuyến khích dùng `defineApiRoute` thay vì gọi thủ công `readBodyWithLimit` hoặc `readRequestBody`.
 */
export async function readBodyWithLimit(
  event: H3Event,
  maxBytes?: number
): Promise<Record<string, string | number | boolean | null | object>> {
  if (maxBytes !== undefined) {
    assertRequestBodySize(event, maxBytes);
  }
  const body = await readRequestBody(event);
  if (typeof body === "object" && body !== null) {
    return body as Record<string, string | number | boolean | null | object>;
  }
  return {};
}

/**
 * Đọc body request rồi trả về dữ liệu thô — **chưa tin được**, người gọi BẮT BUỘC
 * đưa qua Zod (`BR-SEC-04`).
 * Khuyến nghị: dùng `defineApiRoute` cho route mới.
 *
 * Thứ tự nguồn:
 * 1. `readBody(event)` — request thật.
 * 2. `event._body` — nơi Nitro và test đơn vị gắn body dựng sẵn.
 * 3. `event.context.body` — nơi một số middleware nội bộ gắn body đã đọc.
 */
export async function readRequestBody(event: H3Event): Promise<unknown> {
  const parsed = await readBody(event).catch(() => undefined);
  if (isNonEmptyRecord(parsed)) {
    return parsed;
  }

  const injected = Reflect.get(event, "_body");
  if (isNonEmptyRecord(injected)) {
    return injected;
  }

  const contextBody = Reflect.get(event.context, "body");
  if (isNonEmptyRecord(contextBody)) {
    return contextBody;
  }

  return parsed ?? {};
}

function isNonEmptyRecord(value: unknown): boolean {
  return (
    typeof value === "object" && value !== null && Object.keys(value).length > 0
  );
}

/**
 * Đọc query string, ưu tiên `event._query` mà test đơn vị gắn sẵn.
 *
 * `Reflect.get` thay cho `event as Record<string, unknown>`: ép H3Event sang
 * record là một `as` mà `tsc` từ chối (TS2352 — hai kiểu không đủ chồng lấn),
 * và nợ ép kiểu của repo chỉ được giảm (TYPE-SAFETY `BR-TYP-02`).
 */
export function readRequestQuery(event: H3Event): Record<string, unknown> {
  const injected = Reflect.get(event, "_query");
  if (typeof injected === "object" && injected !== null) {
    return injected as Record<string, unknown>;
  }
  return getQuery(event);
}
