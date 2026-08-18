import { type H3Event, readBody } from "h3";

/**
 * Đọc body request rồi trả về `unknown` — **chưa tin được**, người gọi BẮT BUỘC
 * đưa qua Zod (`BR-SEC-04`).
 *
 * Trả `unknown` là cố ý: đây là ranh giới hệ thống, và TYPE-SAFETY `BR-TYP-03`
 * cho phép `unknown` đúng ở chỗ này. ❌ NEVER ép nó thành
 * `Record<string, unknown>` rồi đọc field trực tiếp — làm vậy là bỏ qua
 * validate mà vẫn trông như có kiểu.
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
