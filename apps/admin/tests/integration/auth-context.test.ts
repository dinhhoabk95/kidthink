import { readFileSync } from "node:fs";
import {
  type ManagerTokenPayload,
  requireManagerAuth,
  requireRole,
  type UserTokenPayload,
  verifyAdminManagerToken,
} from "@kidthink/auth";
import { describe, expect, it } from "vitest";

const ADMIN_SECRET = "dev-admin-jwt-secret-must-be-at-least-32-chars-long!!";

const reviewerManager: ManagerTokenPayload = {
  manager_id: 201,
  display_name: "Biên tập viên Bình",
  session_id: "admin-session-xyz",
  refresh_token_version: 1,
  role: "content_reviewer",
};

const superAdminManager: ManagerTokenPayload = {
  manager_id: 202,
  display_name: "Quản trị viên Cường",
  session_id: "admin-session-super",
  refresh_token_version: 1,
  role: "super_admin",
};

describe("apps/admin auth-context integration", () => {
  it("requireManagerAuth is sync and returns ManagerTokenPayload", () => {
    const event = {
      context: {
        user: undefined,
        manager: reviewerManager,
      },
    };

    const manager = requireManagerAuth(event);
    expect(manager).toEqual(reviewerManager);
    expect(manager).not.toHaveProperty("then");
  });

  it("requireRole enforces RBAC server-side and throws INSUFFICIENT_ROLE (403) when role missing", () => {
    const reviewerEvent = {
      context: {
        user: undefined,
        manager: reviewerManager,
      },
    };

    const superAdminEvent = {
      context: {
        user: undefined,
        manager: superAdminManager,
      },
    };

    // super_admin allowed for super_admin requirement
    expect(() => requireRole(superAdminEvent, "super_admin")).not.toThrow();

    // content_reviewer allowed for content_reviewer requirement
    expect(() => requireRole(reviewerEvent, "content_reviewer")).not.toThrow();

    // content_reviewer rejected for super_admin requirement
    expect(() => requireRole(reviewerEvent, "super_admin")).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_ROLE", status: 403 })
    );
  });

  it("rejects User session calling Manager verifier (cross-namespace 401)", async () => {
    const userPayload: UserTokenPayload = {
      user_id: 101,
      display_name: "User An",
      session_id: "sess-user",
      refresh_token_version: 1,
    };

    const userToken = await (await import("@kidthink/auth")).createWebUserToken(
      {
        payload: userPayload,
        secret: ADMIN_SECRET,
      }
    );

    await expect(
      verifyAdminManagerToken({ token: userToken, secret: ADMIN_SECRET })
    ).rejects.toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("rejects User context in requireManagerAuth", () => {
    const userEvent = {
      context: {
        user: {
          user_id: 101,
          display_name: "User An",
          session_id: "sess-user",
          refresh_token_version: 1,
        },
        manager: undefined,
      },
    };

    expect(() => requireManagerAuth(userEvent as never)).toThrowError(
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
    expect(middleware).not.toContain("dev-admin-jwt-secret");
    expect(nuxtConfig).toContain('adminJwtSecret: ""');
  });
});
