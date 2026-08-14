import { readFileSync } from "node:fs";
import {
  type ManagerTokenPayload,
  requireManagerAuth,
  requireRole,
} from "@kidthink/auth";
import { describe, expect, it } from "vitest";

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

  it("loads auth middleware and hooks without hardcoded fallback secrets", () => {
    const middleware = readFileSync(
      new URL("../../server/middleware/auth.ts", import.meta.url),
      "utf8"
    );
    expect(middleware).not.toContain("dev-admin-jwt-secret");
  });
});
