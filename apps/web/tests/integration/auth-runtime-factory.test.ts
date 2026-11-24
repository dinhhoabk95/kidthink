import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import {
  assertRateLimitAllowed as userAssertRateLimitAllowed,
  assertRequestBodySize as userAssertRequestBodySize,
  assertSameOriginRequest as userAssertSameOriginRequest,
} from "../../server/utils/auth-runtime.js";
import {
  factoryAssertPayloadSize,
  factoryAssertRateLimitAllowed,
  factoryAssertRequestBodySize,
  factoryAssertSameOriginRequest,
  factoryIsAllowedApiOrigin,
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
  it("runtime guard exports are the factory functions", () => {
    expect(userAssertRequestBodySize).toBe(factoryAssertRequestBodySize);

    expect(userAssertRateLimitAllowed).toBe(factoryAssertRateLimitAllowed);

    expect(userAssertSameOriginRequest).toBe(factoryAssertSameOriginRequest);
  });

  describe("assertRequestBodySize", () => {
    it("throws PayloadTooLargeError when content-length exceeds limit", () => {
      const event = createMockEvent({ "content-length": "200000" });
      expect(() =>
        factoryAssertRequestBodySize(event, 128 * 1024)
      ).toThrowError();
    });

    it("passes when content-length is within limit", () => {
      const event = createMockEvent({ "content-length": "50000" });
      expect(() =>
        factoryAssertRequestBodySize(event, 128 * 1024)
      ).not.toThrow();
    });
  });

  describe("assertSameOriginRequest", () => {
    it("throws CsrfInvalidError on cross-site fetch site", () => {
      const event = createMockEvent({ "sec-fetch-site": "cross-site" });
      expect(() => factoryAssertSameOriginRequest(event)).toThrowError();
    });

    it("passes when origin matches host", () => {
      const event = createMockEvent({
        origin: "https://mindkid.local",
        host: "mindkid.local",
      });
      expect(() => factoryAssertSameOriginRequest(event)).not.toThrow();
    });
  });

  describe("origin & payload guards", () => {
    it("validates allowed API origin and enforces JSON payload size limit", () => {
      expect(
        factoryIsAllowedApiOrigin("https://mindkid.local", "mindkid.local")
      ).toBe(true);
      expect(() =>
        factoryAssertPayloadSize({ note: "x".repeat(2048) }, 512)
      ).toThrowError();
    });
  });
});
