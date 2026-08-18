import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

describe("apps/web auth route contract", () => {
  it("ships the minimal session/restore/logout/logout-all routes", () => {
    for (const route of [
      "server/api/users/auth/session.get.ts",
      "server/api/users/auth/restore.post.ts",
      "server/api/users/auth/logout.post.ts",
      "server/api/users/auth/logout-all.post.ts",
    ]) {
      expect(source(route)).toContain("defineEventHandler");
    }
  });

  it("keeps the remember token in an HttpOnly cookie and returns only the safe session", () => {
    const route = source("server/api/users/auth/restore.post.ts");
    const runtime = source("server/utils/auth-runtime.ts");

    expect(route).toContain("validateUserCsrf");
    expect(route).toContain("setUserRememberCookie");
    // Trả đúng user đã lọc, không trả nguyên `restored` (có sessionToken thô).
    expect(route).toContain("user: restored.user");
    expect(route).not.toContain("return restored;");
    expect(runtime).toContain("httpOnly: true");
    expect(runtime).not.toContain("localStorage");
  });

  /**
   * Ca âm cho quyết định bỏ refresh token (Task #88): phiên là session opaque
   * trong Redis cộng cookie remember-me. Test này đỏ nếu route hay runtime dựng
   * lại cặp access/refresh cookie hoặc route `/auth/refresh`.
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
    expect(() => source("server/api/users/auth/refresh.post.ts")).toThrow();
  });

  it("provides an app-owned session bridge that forces Sidebase session reload", () => {
    const bridge = source("app/composables/use-kid-think-auth.ts");
    expect(bridge).toContain("getSession({ force: true })");
    expect(bridge).not.toContain("accessToken");
    expect(bridge).not.toContain("refreshToken");
  });
});
