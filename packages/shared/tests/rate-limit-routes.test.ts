import { describe, expect, it } from "vitest";
import {
  normalizeRateLimitPath,
  type RateLimitRouteResolution,
  resolveRateLimitRouteClass,
} from "#src/rate-limit-routes";
import { RATE_LIMIT_CONFIGS } from "#src/rate-limiting";

function resolve(path: string, method = "GET"): RateLimitRouteResolution {
  return resolveRateLimitRouteClass(path, method);
}

describe("resolveRateLimitRouteClass — RATE-LIMITING §7.2 / BR-RTL-10", () => {
  it("normalizes query string and trailing slash to one canonical path", () => {
    expect(normalizeRateLimitPath("/api/users/orders/?page=2")).toBe(
      "/api/users/orders"
    );
    expect(normalizeRateLimitPath("/")).toBe("/");
    expect(resolve("/api/users/orders/?x=1", "POST")).toEqual({
      mode: "middleware",
      className: "payment:create",
    });
  });

  it("routes that no longer call the limiter themselves are covered by middleware", () => {
    const covered: ReadonlyArray<readonly [string, string, string]> = [
      ["POST", "/api/users/auth/reauth", "auth:login"],
      ["POST", "/api/managers/auth/reauth", "auth:login"],
      ["GET", "/api/users/data-export", "export:data"],
      ["POST", "/api/users/play-sessions/x/events", "play:events"],
      ["POST", "/api/guest/play-sessions/x/events", "play:events"],
      ["POST", "/api/users/orders", "payment:create"],
      ["POST", "/api/users/orders/x/proof", "payment:proof"],
    ];
    for (const [method, path, className] of covered) {
      expect(resolve(path, method), `${method} ${path}`).toEqual({
        mode: "middleware",
        className,
      });
    }
  });

  it("rule 1 — non-API paths are exempt", () => {
    expect(resolve("/")).toEqual({ mode: "exempt", reason: "not-api" });
    expect(resolve("/sitemap.xml")).toEqual({
      mode: "exempt",
      reason: "not-api",
    });
    expect(resolve("/apibogus")).toEqual({ mode: "exempt", reason: "not-api" });
  });

  it("rule 2 — auth routes that call the limiter themselves stay in-route", () => {
    expect(resolve("/api/auth/users/sign-in/email", "POST").mode).toBe(
      "in-route"
    );
    expect(resolve("/api/auth/managers/sign-in/email", "POST").mode).toBe(
      "in-route"
    );
    expect(resolve("/api/users/account/delete/cancel", "POST").mode).toBe(
      "in-route"
    );
  });

  it("rule 3 — paths of routes that do not exist have no dedicated rule", () => {
    // Dòng chết đã gỡ (O2): path không có route thật rơi về nhánh đáy, không ở "trong route".
    expect(resolve("/api/guest/auth/users/login", "POST")).toEqual({
      mode: "middleware",
      className: "read:public",
    });
    expect(resolve("/api/users/auth/resend-verification", "POST")).toEqual({
      mode: "exempt",
      reason: "unclassified-user-route",
    });
  });

  it("rules 4-5 — webhooks and the health probe are exempt for a named reason", () => {
    expect(resolve("/api/guest/webhooks/payments/payos", "POST")).toEqual({
      mode: "exempt",
      reason: "provider-webhook",
    });
    expect(resolve("/api/guest/webhooks/payments/vietqr", "POST")).toEqual({
      mode: "exempt",
      reason: "provider-webhook",
    });
    expect(resolve("/api/guest/health")).toEqual({
      mode: "exempt",
      reason: "health-probe",
    });
  });

  it("rule 7 — reauth maps to the login class", () => {
    for (const path of [
      "/api/users/auth/reauth",
      "/api/managers/auth/reauth",
    ]) {
      expect(resolve(path, "POST")).toEqual({
        mode: "middleware",
        className: "auth:login",
      });
    }
  });

  it("rule 9 — mọi route manager rơi về managers:*", () => {
    expect(resolve("/api/managers/images", "POST")).toEqual({
      mode: "middleware",
      className: "managers:*",
    });
    expect(resolve("/api/managers/exports/orders")).toEqual({
      mode: "middleware",
      className: "managers:*",
    });
  });

  it("rules 10-11 — payment create and proof are separate classes", () => {
    expect(resolve("/api/users/orders", "POST")).toEqual({
      mode: "middleware",
      className: "payment:create",
    });
    expect(resolve("/api/users/orders/abc-123/proof", "POST")).toEqual({
      mode: "middleware",
      className: "payment:proof",
    });
    // Đọc một đơn không phải tạo đơn.
    expect(resolve("/api/users/orders/abc-123", "GET").mode).toBe("exempt");
  });

  it("rule 12 — event ingest is play:events for both namespaces (BR-RTL-06, BR-ING-07)", () => {
    for (const path of [
      "/api/users/play-sessions/s-1/events",
      "/api/guest/play-sessions/s-1/events",
    ]) {
      expect(resolve(path, "POST")).toEqual({
        mode: "middleware",
        className: "play:events",
      });
    }
    expect(RATE_LIMIT_CONFIGS["play:events"]).toEqual({
      className: "play:events",
      ipLimit: 600,
      accountLimit: 300,
      windowSeconds: 600,
      failMode: "open",
    });
    // `complete` không phải ingest event, không mượn hạn mức rộng của nó.
    expect(resolve("/api/guest/play-sessions/s-1/complete", "POST")).toEqual({
      mode: "middleware",
      className: "read:public",
    });
  });

  it("rules 13-14 — semantic search and personal-data export", () => {
    expect(resolve("/api/users/ai/search")).toEqual({
      mode: "middleware",
      className: "search",
    });
    expect(resolve("/api/users/data-export")).toEqual({
      mode: "middleware",
      className: "export:data",
    });
    expect(resolve("/api/users/exports", "POST")).toEqual({
      mode: "middleware",
      className: "export:data",
    });
  });

  it("rule 15 — remaining guest routes are read:public", () => {
    expect(resolve("/api/guest/levels")).toEqual({
      mode: "middleware",
      className: "read:public",
    });
    expect(resolve("/api/guest/home")).toEqual({
      mode: "middleware",
      className: "read:public",
    });
  });

  it("rule 16 — remaining user routes are the known gap, named not silent", () => {
    expect(resolve("/api/users/dashboard")).toEqual({
      mode: "exempt",
      reason: "unclassified-user-route",
    });
  });

  it("rule 17 — the bottom branch is a class, never unlimited", () => {
    expect(resolve("/api/unknown/thing", "POST")).toEqual({
      mode: "middleware",
      className: "read:public",
    });
  });

  it("BR-RTL-10 — every resolved class exists in the registry", () => {
    const paths = [
      "/api/guest/levels",
      "/api/users/orders",
      "/api/users/orders/x/proof",
      "/api/users/data-export",
      "/api/users/ai/search",
      "/api/managers/dashboard",
      "/api/users/play-sessions/s/events",
      "/api/users/auth/reauth",
      "/api/unknown",
    ];
    for (const path of paths) {
      const res = resolveRateLimitRouteClass(path, "POST");
      if (res.mode === "exempt") {
        continue;
      }
      expect(RATE_LIMIT_CONFIGS[res.className]).toBeDefined();
    }
  });

  it("BR-RTL-10 negative — an API path never resolves to nothing", () => {
    // Ca âm: nếu resolver mọc một nhánh trả undefined, dòng này đỏ.
    const fuzz = [
      "/api",
      "/api/",
      "/api/users",
      "/api/managers",
      "/api/guest",
      "/api/users/../managers/dashboard",
      "/api/%2e%2e/secret",
      "/api/users/orders/proof",
    ];
    for (const path of fuzz) {
      for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
        const res = resolveRateLimitRouteClass(path, method);
        expect(res).toBeDefined();
        expect(["middleware", "in-route", "exempt"]).toContain(res.mode);
      }
    }
  });
});
