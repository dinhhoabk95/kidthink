import { Readable } from "node:stream";
import { PayloadTooLargeError } from "@mindkid/errors/common";
import { createEvent, type H3Event, readRawBody } from "h3";
import { describe, expect, it } from "vitest";
import { readBoundedRawBody } from "../../../server/utils/bounded-body.js";

const CHUNK_BYTES = 8 * 1024;

function makeEvent(source: Readable): H3Event {
  const req = Object.assign(source, {
    method: "POST",
    url: "/api/users/x",
    headers: { host: "mindkid.test", "transfer-encoding": "chunked" },
    socket: { remoteAddress: "127.0.0.1" },
  });
  return createEvent(req as never, {} as never);
}

describe("BR-SEC-13 — readBoundedRawBody đếm byte theo luồng", () => {
  it("stream vô hạn bị cắt ở 413 mà không buffer hết", async () => {
    let produced = 0;
    function* endless(): Generator<Buffer> {
      while (true) {
        produced += 1;
        yield Buffer.alloc(CHUNK_BYTES, 97);
        if (produced > 100_000) {
          return;
        }
      }
    }
    const maxBytes = 64 * 1024;
    const event = makeEvent(Readable.from(endless()));

    await expect(readBoundedRawBody(event, maxBytes)).rejects.toBeInstanceOf(
      PayloadTooLargeError
    );
    // Dừng ngay sau chunk vượt trần, không đọc cạn nguồn.
    expect(produced).toBeLessThanOrEqual(maxBytes / CHUNK_BYTES + 2);
  });

  it("body trong trần được trả đủ và readRawBody phía sau đọc lại được", async () => {
    const event = makeEvent(Readable.from([Buffer.from("hello "), "world"]));
    const bytes = await readBoundedRawBody(event, 1024);
    expect(new TextDecoder().decode(bytes)).toBe("hello world");
    expect(await readRawBody(event, "utf8")).toBe("hello world");
  });

  it("đọc web stream (workerd) cũng đếm byte và huỷ nguồn khi vượt trần", async () => {
    let pulls = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(CHUNK_BYTES));
      },
      cancel() {
        cancelled = true;
      },
    });
    const event = makeEvent(Readable.from([]));
    Reflect.set(event, "web", { request: { body } });

    await expect(readBoundedRawBody(event, 32 * 1024)).rejects.toBeInstanceOf(
      PayloadTooLargeError
    );
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(10);
  });
});
