import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import {
  assertManagerRateLimitAllowed,
  assertManagerRequestBodySize,
  assertManagerSameOriginRequest,
} from "../../server/utils/admin-auth-runtime.js";
import {
  assertRateLimitAllowed as userAssertRateLimitAllowed,
  assertRequestBodySize as userAssertRequestBodySize,
  assertSameOriginRequest as userAssertSameOriginRequest,
} from "../../server/utils/auth-runtime.js";
import {
  assertRateLimitAllowed,
  assertRequestBodySize,
  assertSameOriginRequest,
  createAuthRuntime,
} from "../../server/utils/auth-runtime-factory.js";

function createMockEvent(
  headers: Record<string, string>,
  method = "POST"
): H3Event {
  const req = {
    method,
    url: "/api/test",
    headers,
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    getHeader: () => undefined,
    setHeader: () => undefined,
  };
  return createEvent(req as never, res as never);
}

describe("auth-runtime-factory", () => {
  it("user and manager runtime share identical guard functions", () => {
    expect(userAssertRequestBodySize).toBe(assertRequestBodySize);
    expect(assertManagerRequestBodySize).toBe(assertRequestBodySize);

    expect(userAssertRateLimitAllowed).toBe(assertRateLimitAllowed);
    expect(assertManagerRateLimitAllowed).toBe(assertRateLimitAllowed);

    expect(userAssertSameOriginRequest).toBe(assertSameOriginRequest);
    expect(assertManagerSameOriginRequest).toBe(assertSameOriginRequest);
  });

  describe("assertRequestBodySize", () => {
    it("throws PayloadTooLargeError when content-length exceeds limit", () => {
      const event = createMockEvent({ "content-length": "200000" });
      expect(() => assertRequestBodySize(event, 128 * 1024)).toThrowError();
    });

    it("passes when content-length is within limit", () => {
      const event = createMockEvent({ "content-length": "50000" });
      expect(() => assertRequestBodySize(event, 128 * 1024)).not.toThrow();
    });
  });

  describe("assertSameOriginRequest", () => {
    it("throws CsrfInvalidError on cross-site fetch site", () => {
      const event = createMockEvent({ "sec-fetch-site": "cross-site" });
      expect(() => assertSameOriginRequest(event)).toThrowError();
    });

    it("passes when origin matches host", () => {
      const event = createMockEvent({
        origin: "https://mindkid.local",
        host: "mindkid.local",
      });
      expect(() => assertSameOriginRequest(event)).not.toThrow();
    });
  });

  describe("createAuthRuntime namespace cookies", () => {
    it("creates distinct runtimes for user and manager namespaces", () => {
      const userRuntime = createAuthRuntime("user");
      const managerRuntime = createAuthRuntime("manager");

      expect(typeof userRuntime.ensureCsrfCookie).toBe("function");
      expect(typeof managerRuntime.ensureCsrfCookie).toBe("function");
      expect(typeof userRuntime.validateCsrf).toBe("function");
      expect(typeof managerRuntime.validateCsrf).toBe("function");
    });
  });
});
