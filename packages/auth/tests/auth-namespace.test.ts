import { describe, expect, it } from "vitest";
import { getAuthNamespaceConfig } from "../src/auth-namespace";

describe("auth namespace runtime contract", () => {
  it("keeps User and Manager cookie, issuer, audience and TTL boundaries separate", () => {
    expect(getAuthNamespaceConfig("user")).toEqual({
      namespace: "user",
      audience: "kidthink:user",
      issuer: "kidthink:web",
      accessCookieName: "kidthink-user-access",
      refreshCookieName: "tm_u_rt",
      csrfCookieName: "tm_u_csrf",
      refreshPath: "/api/users/auth/refresh",
      refreshTtlSeconds: 7 * 24 * 60 * 60,
    });
    expect(getAuthNamespaceConfig("manager")).toEqual({
      namespace: "manager",
      audience: "kidthink:manager",
      issuer: "kidthink:admin",
      accessCookieName: "kidthink-manager-access",
      refreshCookieName: "tm_m_rt",
      csrfCookieName: "tm_m_csrf",
      refreshPath: "/api/managers/auth/refresh",
      refreshTtlSeconds: 24 * 60 * 60,
    });
  });
});
