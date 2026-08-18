import { describe, expect, it } from "vitest";
import { getAuthNamespaceConfig } from "../src/auth-namespace";

describe("auth namespace runtime contract", () => {
  it("keeps User and Manager CSRF cookies separate", () => {
    expect(getAuthNamespaceConfig("user")).toEqual({
      namespace: "user",
      csrfCookieName: "tm_u_csrf",
    });
    expect(getAuthNamespaceConfig("manager")).toEqual({
      namespace: "manager",
      csrfCookieName: "tm_m_csrf",
    });
  });

  /**
   * Ca âm cho quyết định bỏ refresh token: phiên là session opaque trong Redis
   * cộng cookie remember-me, không còn cặp access/refresh cookie. Test này đỏ
   * ngay nếu ai đó dựng lại vòng đời token thứ hai qua đường config.
   */
  it("does not reintroduce access or refresh token config", () => {
    for (const namespace of ["user", "manager"] as const) {
      const config = getAuthNamespaceConfig(namespace) as unknown as Record<
        string,
        unknown
      >;
      expect(Object.keys(config).sort()).toEqual([
        "csrfCookieName",
        "namespace",
      ]);
    }
  });
});
