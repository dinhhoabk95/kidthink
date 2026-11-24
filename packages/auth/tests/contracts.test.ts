import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  type ManagerTokenPayload,
  requireManagerAuth,
  requireRole,
  requireUserAuth,
  type UserTokenPayload,
} from "#src/index";

const AUTH_VENDOR_PATTERN = /@sidebase\/nuxt-auth|next-auth|AuthJS/;

const user: UserTokenPayload = {
  user_id: 101,
  display_name: "Người dùng An",
  session_id: "session-user-1",
  active_child_db_id: 301,
};

const reviewer: ManagerTokenPayload = {
  manager_id: 201,
  display_name: "Biên tập viên Bình",
  session_id: "session-manager-1",
  role: "content_reviewer",
};

describe("Task 16 contract boundaries", () => {
  it("BR-ACT-01/BR-ACT-02 rejects cross-audience contexts in both directions", () => {
    const userEvent = { context: { user } };
    const managerEvent = { context: { manager: reviewer } };

    expect(() => requireManagerAuth(userEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
    expect(() => requireUserAuth(managerEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("BR-AUT-02 keeps guards synchronous", () => {
    const event = { context: { user } };
    const result = requireUserAuth(event);

    expect(result).toBe(user);
    expect(result).not.toHaveProperty("then");
    expectTypeOf(requireUserAuth).returns.toEqualTypeOf<UserTokenPayload>();
  });

  it("rejects a context carrying both User and Manager identities", () => {
    const bothEvent = { context: { user, manager: reviewer } };

    expect(() => requireUserAuth(bothEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
    expect(() => requireManagerAuth(bothEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
  });

  it("BR-ACT-08 prevents content reviewers from taking super-admin actions", () => {
    const event = { context: { manager: reviewer } };

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

  it("does not export or import auth-vendor types through the public entrypoint", async () => {
    const entrypointPath = fileURLToPath(
      new URL("../src/index.ts", import.meta.url)
    );
    const entrypoint = await readFile(entrypointPath, "utf8");

    expect(entrypoint).not.toMatch(AUTH_VENDOR_PATTERN);
  });
});
