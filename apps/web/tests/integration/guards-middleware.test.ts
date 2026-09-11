import { CsrfInvalidError } from "@mindkid/errors/auth";
import { PayloadTooLargeError } from "@mindkid/errors/common";
import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import guardsMiddleware from "#server/middleware/guards";

function createResponse() {
  const headers = new Map<string, string | string[]>();
  return {
    headersSent: false,
    writableEnded: false,
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    setHeader: (name: string, value: string | string[]) => {
      headers.set(name.toLowerCase(), value);
    },
    removeHeader: (name: string) => headers.delete(name.toLowerCase()),
    getHeaders: () => Object.fromEntries(headers),
    end: () => undefined,
  };
}

function makeEvent(options: {
  path: string;
  method?: string;
  headers?: Record<string, string>;
}): H3Event {
  const req = {
    method: options.method ?? "POST",
    url: options.path,
    headers: { host: "mindkid.test", ...(options.headers ?? {}) },
    socket: { remoteAddress: "127.0.0.1" },
  };
  return createEvent(
    req as never,
    createResponse() as never
  ) as never as H3Event;
}

describe("middleware/guards", () => {
  it("bỏ qua request GET không kiểm tra trần body hay same-origin", () => {
    const event = makeEvent({
      path: "/api/users/profile",
      method: "GET",
      headers: { "sec-fetch-site": "cross-site" },
    });

    expect(() => guardsMiddleware(event)).not.toThrow();
  });

  it("bỏ qua route ngoài /api/*", () => {
    const event = makeEvent({
      path: "/games/play",
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    });

    expect(() => guardsMiddleware(event)).not.toThrow();
  });

  it("bỏ qua webhook nhà cung cấp (/api/guest/webhooks/**)", () => {
    const event = makeEvent({
      path: "/api/guest/webhooks/payos",
      method: "POST",
      headers: {
        "content-length": "2097152", // 2 MB
        "sec-fetch-site": "cross-site",
      },
    });

    expect(() => guardsMiddleware(event)).not.toThrow();
  });

  it("T3.1f ca âm: Content-Length vượt trần mặc định 128 KiB ném 413 PayloadTooLargeError", () => {
    const event = makeEvent({
      path: "/api/users/collections",
      method: "POST",
      headers: {
        "content-length": String(128 * 1024 + 1),
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
    });

    expect(() => guardsMiddleware(event)).toThrow(PayloadTooLargeError);
  });

  it("T3.1g ca âm: Sec-Fetch-Site cross-site ném 403 CsrfInvalidError", () => {
    const event = makeEvent({
      path: "/api/users/collections",
      method: "POST",
      headers: {
        "content-length": "100",
        "sec-fetch-site": "cross-site",
        origin: "https://evil.com",
      },
    });

    expect(() => guardsMiddleware(event)).toThrow(CsrfInvalidError);
  });

  it("T3.1h ca âm: Origin ngoài NUXT_ALLOWED_ORIGINS ném 403 CsrfInvalidError", () => {
    const event = makeEvent({
      path: "/api/users/collections",
      method: "POST",
      headers: {
        "content-length": "100",
        "sec-fetch-site": "same-origin",
        origin: "https://unauthorized-domain.com",
      },
    });

    expect(() => guardsMiddleware(event)).toThrow(CsrfInvalidError);
  });

  it("cho phép request mutating hợp lệ cùng origin đi qua thành công", () => {
    const event = makeEvent({
      path: "/api/users/collections",
      method: "POST",
      headers: {
        "content-length": "256",
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
    });

    expect(() => guardsMiddleware(event)).not.toThrow();
  });

  it("cho phép upload ảnh lên /api/managers/images trong hạn mức 2 MiB", () => {
    const event = makeEvent({
      path: "/api/managers/images",
      method: "POST",
      headers: {
        "content-length": String(1.5 * 1024 * 1024), // 1.5 MiB < 2 MiB
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
    });

    expect(() => guardsMiddleware(event)).not.toThrow();
  });

  it("cho phép upload chứng từ 2 MiB lên /api/users/orders/:uuid/proof không bị 413 (C1)", () => {
    const event = makeEvent({
      path: "/api/users/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/proof",
      method: "POST",
      headers: {
        "content-length": String(2 * 1024 * 1024), // 2 MiB
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
    });

    expect(() => guardsMiddleware(event)).not.toThrow();
  });

  it("chặn upload chứng từ vượt trần 5 MiB + 64 KiB ném 413 PayloadTooLargeError (C1)", () => {
    const event = makeEvent({
      path: "/api/users/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/proof",
      method: "POST",
      headers: {
        "content-length": String(5.5 * 1024 * 1024), // 5.5 MiB > 5 MiB + 64 KiB
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
    });

    expect(() => guardsMiddleware(event)).toThrow(PayloadTooLargeError);
  });
});
