import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

describe("apps/web auth route contract", () => {
  it("ships the minimal session/refresh/logout/logout-all routes", () => {
    for (const route of [
      "server/api/users/auth/session.get.ts",
      "server/api/users/auth/refresh.post.ts",
      "server/api/users/auth/logout.post.ts",
      "server/api/users/auth/logout-all.post.ts",
    ]) {
      expect(source(route)).toContain("defineEventHandler");
    }
  });

  it("keeps raw tokens in HttpOnly cookies and returns only the safe session", () => {
    const route = source("server/api/users/auth/refresh.post.ts");
    const runtime = source("server/utils/auth-runtime.ts");

    expect(route).toContain("validateUserCsrf");
    expect(route).toContain("setUserAuthCookies");
    expect(route).toContain("assertUserSession(result.session)");
    expect(route).toContain("return session");
    expect(route).not.toContain("return result;");
    expect(runtime).toContain('getAuthNamespaceConfig("user")');
    expect(runtime).toContain("path: config.refreshPath");
    expect(runtime).toContain("httpOnly: true");
    expect(runtime).not.toContain("localStorage");
  });

  it("provides an app-owned refresh bridge that forces Sidebase session reload", () => {
    const bridge = source("app/composables/use-kid-think-auth.ts");
    expect(bridge).toContain("getSession({ force: true })");
    expect(bridge).not.toContain("accessToken");
    expect(bridge).not.toContain("refreshToken");
  });
});
