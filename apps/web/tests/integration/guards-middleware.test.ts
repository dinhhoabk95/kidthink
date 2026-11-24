import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { REPO_ROOT } from "@mindkid/config/paths";
import { CsrfInvalidError } from "@mindkid/errors/auth";
import { PayloadTooLargeError } from "@mindkid/errors/common";
import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import guardsMiddleware from "#server/middleware/guards";
import { listApiRoutes } from "../gates/rate-limit-coverage.ts";

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
  body?: Buffer;
}): H3Event {
  const base = options.body ? Readable.from([options.body]) : {};
  const req = Object.assign(base, {
    method: options.method ?? "POST",
    url: options.path,
    headers: { host: "mindkid.test", ...(options.headers ?? {}) },
    socket: { remoteAddress: "127.0.0.1" },
  });
  return createEvent(
    req as never,
    createResponse() as never
  ) as never as H3Event;
}

const AUTHENTICATED_ROUTE =
  /requireWebUserSession\(|requireManagerSession\(|requireSuperAdminSession\(|auth:\s*"(?:user|manager|super_admin)"/;

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

  it("cho phép upload chứng từ 1 MiB lên /api/users/orders/:uuid/proof không bị 413 (C1)", () => {
    const event = makeEvent({
      path: "/api/users/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/proof",
      method: "POST",
      headers: {
        "content-length": String(1024 * 1024), // 1 MiB
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
    });

    expect(() => guardsMiddleware(event)).not.toThrow();
  });

  it("chặn upload chứng từ vượt trần 1,5 MiB + 64 KiB ném 413 PayloadTooLargeError (C1)", () => {
    const event = makeEvent({
      path: "/api/users/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/proof",
      method: "POST",
      headers: {
        "content-length": String(5.5 * 1024 * 1024), // 5.5 MiB > 1,5 MiB + 64 KiB
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
    });

    expect(() => guardsMiddleware(event)).toThrow(PayloadTooLargeError);
  });

  it("BR-SEC-13 ca âm: chunked không có Content-Length nhưng body thực 200 KiB ném 413", async () => {
    const event = makeEvent({
      path: "/api/users/collections",
      method: "POST",
      headers: {
        "transfer-encoding": "chunked",
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
      body: Buffer.alloc(200 * 1024, 97),
    });

    await expect(
      Promise.resolve().then(() => guardsMiddleware(event))
    ).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it("BR-SEC-13/BR-CSRF-02: chunked cross-site bị 403 trước khi đọc thân", () => {
    const event = makeEvent({
      path: "/api/users/collections",
      method: "POST",
      headers: {
        "transfer-encoding": "chunked",
        "sec-fetch-site": "cross-site",
        origin: "https://evil.com",
      },
      body: Buffer.alloc(200 * 1024, 97),
    });

    expect(() => guardsMiddleware(event)).toThrow(CsrfInvalidError);
    // Stream chưa bị kéo: chưa ai đọc thân request.
    expect(event.node.req.readableFlowing).toBeNull();
  });

  it("BR-SEC-13: chunked body nhỏ không có Content-Length đi qua", async () => {
    const event = makeEvent({
      path: "/api/users/collections",
      method: "POST",
      headers: {
        "transfer-encoding": "chunked",
        "sec-fetch-site": "same-origin",
        origin: "https://mindkid.test",
      },
      body: Buffer.from('{"a":1}'),
    });

    await expect(
      Promise.resolve().then(() => guardsMiddleware(event))
    ).resolves.toBeUndefined();
  });

  // Helper `require*Session` không còn tự kiểm CSRF: `guards` là chỗ duy nhất (BR-CSRF-02).
  // Test này chứng minh `guards` phủ MỌI route mutation có xác thực phiên.
  it("BR-CSRF-02: guards chặn cross-site trên mọi route mutation có xác thực phiên", () => {
    const mutating = new Set(["POST", "PUT", "PATCH", "DELETE"]);
    const apiRoot = join(REPO_ROOT, "apps/web/server/api");
    const covered = listApiRoutes().filter(
      (route) =>
        mutating.has(route.method) &&
        AUTHENTICATED_ROUTE.test(
          readFileSync(join(apiRoot, route.file), "utf8")
        )
    );

    expect(covered.length).toBeGreaterThan(50);
    for (const route of covered) {
      expect(
        route.path.startsWith("/api/") &&
          !route.path.startsWith("/api/guest/webhooks/"),
        route.path
      ).toBe(true);
      const event = makeEvent({
        path: route.path,
        method: route.method,
        headers: {
          "content-length": "10",
          "sec-fetch-site": "cross-site",
          origin: "https://evil.com",
        },
      });
      expect(() => guardsMiddleware(event), route.path).toThrow(
        CsrfInvalidError
      );
    }
  });
});
