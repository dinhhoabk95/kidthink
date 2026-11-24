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
export async function readBoundedRawBody(
  event: H3Event,
  maxBytes: number
): Promise<Uint8Array | undefined> {
  const webBody = (event as H3Event & WebBodyHolder).web?.request?.body;
  const nodeReq: object | undefined = event.node?.req;
  let bytes: Uint8Array | undefined;
  if (webBody) {
    bytes = await readWebStream(webBody, maxBytes);
  } else if (isAsyncIterable(nodeReq)) {
    bytes = await readNodeStream(nodeReq, maxBytes);
  }
  if (bytes === undefined) {
    return undefined;
  }
  Reflect.set(event, "_requestBody", bytes);
  return bytes;
}
