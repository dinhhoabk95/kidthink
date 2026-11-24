import { PayloadTooLargeError } from "@mindkid/errors/common";
import type { H3Event } from "h3";

interface WebBodyHolder {
  readonly web?: {
    readonly request?: { readonly body?: ReadableStream<Uint8Array> | null };
  };
}

function toBytes(chunk: string | Uint8Array): Uint8Array {
  return typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk;
}

function concat(chunks: readonly Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function readWebStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return concat(chunks, total);
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }
}

async function readNodeStream(
  source: AsyncIterable<string | Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
  const iterator = source[Symbol.asyncIterator]();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await iterator.next();
    if (done) {
      return concat(chunks, total);
    }
    const bytes = toBytes(value);
    total += bytes.byteLength;
    if (total > maxBytes) {
      // Không gọi iterator.return(): huỷ stream sẽ đóng socket trước khi kịp trả 413.
      throw new PayloadTooLargeError();
    }
    chunks.push(bytes);
  }
}

function isAsyncIterable(
  value: object | undefined
): value is AsyncIterable<string | Uint8Array> {
  return value !== undefined && Symbol.asyncIterator in value;
}

/**
 * BR-SEC-13: đọc thân request **theo luồng, đếm byte**, ném 413 ngay khi vượt `maxBytes`
 * thay vì buffer hết rồi mới so. Chạy trên Node (stream của `event.node.req`) và workerd
 * (`event.web.request.body`). Thân đã đọc được gắn lại vào event để `readRawBody`/`readBody`
 * phía sau dùng tiếp mà không đọc lần hai.
 */
function isWebStream(
  value: object | string | undefined
): value is ReadableStream<Uint8Array> {
  return (
    typeof value === "object" &&
    value !== null &&
    "getReader" in value &&
    typeof value.getReader === "function"
  );
}

/** Thân nằm sẵn trong bộ nhớ (workerd/unenv gắn `req.body` là chuỗi hoặc byte). */
function readInMemory(
  value: string | Uint8Array,
  maxBytes: number
): Uint8Array {
  const bytes = toBytes(value);
  if (bytes.byteLength > maxBytes) {
    throw new PayloadTooLargeError();
  }
  return bytes;
}

async function readFromEvent(
  event: H3Event,
  maxBytes: number
): Promise<Uint8Array | undefined> {
  const webBody = (event as H3Event & WebBodyHolder).web?.request?.body;
  if (webBody) {
    return await readWebStream(webBody, maxBytes);
  }
  const nodeReq = event.node?.req as
    | (object & { rawBody?: string | Uint8Array; body?: object | string })
    | undefined;
  // Trên workerd `event.node.req` là Readable của unenv: `Symbol.asyncIterator` có mặt nhưng
  // ném "not implemented"; thân thật nằm ở `req.body` (web stream) — đọc nó trước.
  const held = nodeReq?.rawBody ?? nodeReq?.body;
  if (isWebStream(held)) {
    return await readWebStream(held, maxBytes);
  }
  if (typeof held === "string" || held instanceof Uint8Array) {
    return readInMemory(held, maxBytes);
  }
  if (isAsyncIterable(nodeReq)) {
    return await readNodeStream(nodeReq, maxBytes);
  }
  return undefined;
}

/**
 * BR-SEC-13: đọc thân request **theo luồng, đếm byte**, ném 413 ngay khi vượt `maxBytes`
 * thay vì buffer hết rồi mới so. Chạy trên Node (stream của `event.node.req`) và workerd
 * (`event.web.request.body` hoặc `event.node.req.body`). Thân đã đọc được gắn lại vào event
 * để `readRawBody`/`readBody` phía sau dùng tiếp mà không đọc lần hai.
 */
export async function readBoundedRawBody(
  event: H3Event,
  maxBytes: number
): Promise<Uint8Array | undefined> {
  const bytes = await readFromEvent(event, maxBytes);
  if (bytes === undefined) {
    return undefined;
  }
  Reflect.set(event, "_requestBody", bytes);
  return bytes;
}
