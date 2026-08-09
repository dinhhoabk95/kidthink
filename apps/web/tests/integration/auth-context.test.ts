import { readFileSync } from "node:fs";
import {
  createAdminManagerToken,
  type ManagerTokenPayload,
  requireUserAuth,
  type UserTokenPayload,
} from "@kidthink/auth";
import { describe, expect, it } from "vitest";

const WEB_SECRET = "dev-web-jwt-secret-must-be-at-least-32-chars-long!!";

const sampleUserPayload: UserTokenPayload = {
  user_id: 42,
  display_name: "Phụ huynh Minh",
  session_id: "web-session-abc",
  refresh_token_version: 1,
  active_child_id: 10,
};

describe("apps/web auth-context integration", () => {
  it("requireUserAuth is sync and returns UserTokenPayload for valid context", () => {
    // Simulate event context populated by middleware
    const event = {
      context: {
        user: sampleUserPayload,
        manager: undefined,
      },
    };

    const user = requireUserAuth(event);
    expect(user).toEqual(sampleUserPayload);
    expect(user).not.toHaveProperty("then"); // sync check
  });

  it("requireUserAuth throws UNAUTHENTICATED (401) when user is missing", () => {
    const event = {
      context: {
        user: undefined,
        manager: undefined,
      },
    };

    expect(() => requireUserAuth(event)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("requireUserAuth throws UNAUTHENTICATED (401) if context accidentally carries manager", () => {
    const managerPayload: ManagerTokenPayload = {
      manager_id: 1,
      display_name: "Admin",
      session_id: "sess-admin",
      refresh_token_version: 1,
      role: "super_admin",
    };

    const event = {
      context: {
        user: sampleUserPayload,
        manager: managerPayload,
      },
    };

    expect(() => requireUserAuth(event as never)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("validates User payload contains no role/tier/package/entitlement", () => {
    expect(sampleUserPayload).not.toHaveProperty("role");
    expect(sampleUserPayload).not.toHaveProperty("tier");
    expect(sampleUserPayload).not.toHaveProperty("package");
    expect(sampleUserPayload).not.toHaveProperty("entitlement");
  });

  it("rejects a canonical Manager token even if both namespaces are misconfigured with one secret", async () => {
    const managerPayload: ManagerTokenPayload = {
      manager_id: 7,
      display_name: "Quản trị viên",
      session_id: "manager-session-7",
      refresh_token_version: 0,
      role: "content_reviewer",
    };
    const tokenForAdmin = await createAdminManagerToken({
      payload: managerPayload,
      secret: WEB_SECRET,
    });

    // Attempting to verify tokenForAdmin with default web audience should fail
    const { verifyWebUserToken } = await import("@kidthink/auth");
    await expect(
      verifyWebUserToken({ token: tokenForAdmin, secret: WEB_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("loads the JWT secret only from private Nuxt runtime config without a public fallback", () => {
    const middleware = readFileSync(
      new URL("../../server/middleware/auth.ts", import.meta.url),
      "utf8"
    );
    const nuxtConfig = readFileSync(
      new URL("../../nuxt.config.ts", import.meta.url),
      "utf8"
    );

    expect(middleware).toContain("useRuntimeConfig(event)");
    expect(middleware).not.toContain("process.env");
    expect(middleware).not.toContain("dev-web-jwt-secret");
    expect(nuxtConfig).toContain('webJwtSecret: ""');
  });
});
