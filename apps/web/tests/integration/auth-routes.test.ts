import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

describe("apps/web Better Auth route contract (BR-AUT-39..45)", () => {
  it("ships isolated Better Auth catch-all handlers for users and managers plus reauth & social consent routes", () => {
    expect(source("server/api/auth/users/[...all].ts")).toContain(
      "getUserAuth"
    );
    expect(source("server/api/auth/managers/[...all].ts")).toContain(
      "getManagerAuth"
    );
    expect(
      source("server/api/guest/auth/users/social-consent.post.ts")
    ).toContain("createSocialSignupConsentTicket");
    expect(source("server/api/users/auth/reauth.post.ts")).toContain(
      "defineEventHandler"
    );
    expect(source("server/api/managers/auth/reauth.post.ts")).toContain(
      "defineEventHandler"
    );
  });

  it("uses HttpOnly cookies and never stores tokens in localStorage", () => {
    const runtime = source("server/utils/auth-runtime.ts");
    const socialConsent = source(
      "server/api/guest/auth/users/social-consent.post.ts"
    );

    expect(socialConsent).toContain("httpOnly: true");
    expect(runtime).toContain("httpOnly: true");
    expect(runtime).not.toContain("localStorage");
  });

  it("does not reintroduce an access/refresh token pair or /auth/refresh route", () => {
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

  it("provides an app-owned Better Auth session bridge without JWT/refresh tokens", () => {
    const bridge = source("app/composables/use-kid-think-auth.ts");
    expect(bridge).toContain("useUserAuthClient");
    expect(bridge).not.toContain("accessToken");
    expect(bridge).not.toContain("refreshToken");
  });
});
