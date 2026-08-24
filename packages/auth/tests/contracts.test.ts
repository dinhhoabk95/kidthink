import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  AppError,
  AUTH_ERROR_DEFINITIONS,
  type AuditPort,
  appError,
  type ChildOwnershipPort,
  createAuthContext,
  type EntitlementPort,
  type ManagerTokenPayload,
  type RateLimitPort,
  requireManagerAuth,
  requireRole,
  requireUserAuth,
  type SessionStorePort,
  type UserTokenPayload,
} from "#src/index";

const AUTH_VENDOR_PATTERN = /@sidebase\/nuxt-auth|next-auth|AuthJS/;

const user: UserTokenPayload = {
  user_id: 101,
  display_name: "Người dùng An",
  session_id: "session-user-1",
  active_child_id: 301,
};

const reviewer: ManagerTokenPayload = {
  manager_id: 201,
  display_name: "Biên tập viên Bình",
  session_id: "session-manager-1",
  role: "content_reviewer",
};

describe("Task 16 contract boundaries", () => {
  it("BR-ACT-01/BR-ACT-02 rejects cross-audience contexts in both directions", () => {
    const userEvent = { context: createAuthContext({ user }) };
    const managerEvent = { context: createAuthContext({ manager: reviewer }) };

    expect(() => requireManagerAuth(userEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
    expect(() => requireUserAuth(managerEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("BR-AUT-02 keeps guards synchronous", () => {
    const event = { context: createAuthContext({ user }) };
    const result = requireUserAuth(event);

    expect(result).toBe(user);
    expect(result).not.toHaveProperty("then");
    expectTypeOf(requireUserAuth).returns.toEqualTypeOf<UserTokenPayload>();
  });

  it("rejects a context carrying both User and Manager identities", () => {
    expect(() =>
      createAuthContext({ user, manager: reviewer } as never)
    ).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("BR-ACT-08 prevents content reviewers from taking super-admin actions", () => {
    const event = { context: createAuthContext({ manager: reviewer }) };

    expect(() => requireRole(event, "super_admin")).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_ROLE", status: 403 })
    );
  });

  it("keeps the User payload free of role, package, tier and entitlement", () => {
    expect(user).not.toHaveProperty("role");
    expect(user).not.toHaveProperty("package");
    expect(user).not.toHaveProperty("tier");
    expect(user).not.toHaveProperty("entitlement");
  });

  it.each([
    ["UNAUTHENTICATED", 401],
    ["INSUFFICIENT_ROLE", 403],
    ["NO_ACTIVE_CHILD", 428],
    ["NOT_FOUND", 404],
    ["SESSION_REVOKED", 401],
    ["REAUTH_REQUIRED", 428],
  ] as const)("maps %s to HTTP %i", (code, status) => {
    const error = appError(code);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      code,
      status,
      message: AUTH_ERROR_DEFINITIONS[code].message,
    });
    expect(error.toResponse()).toEqual({
      code,
      message: AUTH_ERROR_DEFINITIONS[code].message,
    });
  });

  it("defines async seams for external state without implementing adapters", async () => {
    const sessionStore = {} as SessionStorePort;
    const rateLimit = {} as RateLimitPort;
    const audit = {} as AuditPort;
    const ownership = {} as ChildOwnershipPort;
    const entitlement = {} as EntitlementPort;

    expectTypeOf(sessionStore).toMatchTypeOf<SessionStorePort>();
    expectTypeOf(rateLimit).toMatchTypeOf<RateLimitPort>();
    expectTypeOf(audit).toMatchTypeOf<AuditPort>();
    expectTypeOf(ownership).toMatchTypeOf<ChildOwnershipPort>();
    expectTypeOf(entitlement).toMatchTypeOf<EntitlementPort>();
    await expect(Promise.resolve()).resolves.toBeUndefined();
  });

  it("does not export or import auth-vendor types through the public entrypoint", async () => {
    const entrypointPath = fileURLToPath(
      new URL("../src/index.ts", import.meta.url)
    );
    const entrypoint = await readFile(entrypointPath, "utf8");

    expect(entrypoint).not.toMatch(AUTH_VENDOR_PATTERN);
  });
});
