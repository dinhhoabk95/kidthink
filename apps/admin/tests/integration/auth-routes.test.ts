import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

describe("apps/admin auth route contract", () => {
  it("ships the minimal session/restore/logout/logout-all routes", () => {
    for (const route of [
      "server/api/managers/auth/session.get.ts",
      "server/api/managers/auth/restore.post.ts",
      "server/api/managers/auth/logout.post.ts",
      "server/api/managers/auth/logout-all.post.ts",
    ]) {
      expect(source(route)).toContain("defineEventHandler");
    }
  });

  it("restore returns only the safe manager, never the raw session token", () => {
    const route = source("server/api/managers/auth/restore.post.ts");

    expect(route).toContain("validateManagerCsrf");
    expect(route).toContain("setManagerRememberCookie");
    expect(route).toContain("manager: restored.manager");
    expect(route).not.toContain("return restored;");
  });

  /**
   * Ca âm cho quyết định bỏ refresh token (Task #88): phiên là session opaque
   * trong Redis cộng cookie remember-me. Test này đỏ nếu runtime dựng lại cặp
   * access/refresh cookie, hoặc nếu route `/auth/refresh` quay lại.
   */
  it("does not reintroduce an access/refresh token pair", () => {
    const runtime = source("server/utils/auth-runtime.ts");
    for (const banned of [
      "refreshCookieName",
      "accessCookieName",
      "refreshPath",
      "refreshTtlSeconds",
      "RefreshService",
    ]) {
      expect(runtime).not.toContain(banned);
    }
    expect(runtime).not.toContain("localStorage");
    expect(() => source("server/api/managers/auth/refresh.post.ts")).toThrow();
  });

  it("provides an app-owned session bridge that forces Sidebase session reload", () => {
    const bridge = source("app/composables/use-kid-think-auth.ts");
    expect(bridge).toContain("getSession({ force: true })");
    expect(bridge).not.toContain("accessToken");
    expect(bridge).not.toContain("refreshToken");
  });
});
