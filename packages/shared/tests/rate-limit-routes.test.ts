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

  it("rule 1 — non-API paths are exempt", () => {
    expect(resolve("/")).toEqual({ mode: "exempt", reason: "not-api" });
    expect(resolve("/sitemap.xml")).toEqual({
      mode: "exempt",
      reason: "not-api",
    });
    expect(resolve("/apibogus")).toEqual({ mode: "exempt", reason: "not-api" });
  });

  it("rules 2-3 — auth routes stay enforced inside the handler", () => {
    expect(resolve("/api/guest/auth/users/login", "POST").mode).toBe(
      "in-route"
    );
    expect(resolve("/api/guest/auth/oauth/google/start").mode).toBe("in-route");
    expect(resolve("/api/users/auth/resend-verification", "POST").mode).toBe(
      "in-route"
    );
  });

  it("rules 4-5 — webhooks and the health probe are exempt for a named reason", () => {
    expect(resolve("/api/guest/webhooks/ses-sns", "POST")).toEqual({
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

  it("rules 6-7 — session restore and reauth map to their classes", () => {
    for (const path of [
      "/api/users/auth/restore",
      "/api/managers/auth/restore",
    ]) {
      expect(resolve(path, "POST")).toEqual({
        mode: "middleware",
        className: "auth:refresh",
      });
    }
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

  it("rule 8 beats rule 9 — image upload is narrower than managers:*", () => {
    expect(resolve("/api/managers/images", "POST")).toEqual({
      mode: "middleware",
      className: "upload:image",
    });
    // Xoá ảnh không phải upload; nó rơi về lớp chung của manager.
    expect(resolve("/api/managers/images/12", "DELETE")).toEqual({
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

  it("rule 12 — event ingest is play:events for both namespaces (BR-RTL-06)", () => {
    for (const path of [
      "/api/users/play-sessions/s-1/events",
      "/api/guest/play-sessions/s-1/events",
    ]) {
      expect(resolve(path, "POST")).toEqual({
        mode: "middleware",
        className: "play:events",
      });
    }
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
      "/api/managers/images",
      "/api/managers/dashboard",
      "/api/users/play-sessions/s/events",
      "/api/users/auth/restore",
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
