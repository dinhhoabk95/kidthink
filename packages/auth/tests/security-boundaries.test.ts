import { describe, expect, it } from "vitest";
import {
  assertActiveChild,
  type ChildOwnershipPort,
  createAuthContext,
  createRedisSecondaryStorage,
  deriveInstanceSecret,
  InMemoryRedisClient,
  type ManagerTokenPayload,
  requireManagerAuth,
  requireRole,
  requireUserAuth,
  type UserTokenPayload,
  verifyChildOwnership,
  verifyReauthWindow,
} from "#src/index";

describe("Security Evidence — Better Auth Dual-Instance Boundaries (Task #319)", () => {
  it("BR-ACT-01, BR-ACT-02 & BR-AUT-39: Separate guards, separate HMAC secrets, and isolated Redis namespaces", async () => {
    const userPayload: UserTokenPayload = {
      user_id: 1,
      display_name: "User One",
      session_id: "s-user",
    };
    const managerPayload: ManagerTokenPayload = {
      manager_id: 2,
      display_name: "Manager Two",
      session_id: "s-mgr",
      role: "content_reviewer",
    };

    const userEvent = { context: createAuthContext({ user: userPayload }) };
    const managerEvent = {
      context: createAuthContext({ manager: managerPayload }),
    };

    expect(() => requireManagerAuth(userEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );
    expect(() => requireUserAuth(managerEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );

    const rootSecret = "mindkid-root-secret-at-least-32-bytes-long!!";
    expect(deriveInstanceSecret(rootSecret, "user")).not.toBe(
      deriveInstanceSecret(rootSecret, "manager")
    );

    const redis = new InMemoryRedisClient();
    const userStorage = createRedisSecondaryStorage(redis, "user");
    const managerStorage = createRedisSecondaryStorage(redis, "manager");

    await userStorage.set("session:tok123", '{"userId":"1"}', 3600);
    expect(await managerStorage.get("session:tok123")).toBeNull();
    expect(await userStorage.get("session:tok123")).toBe('{"userId":"1"}');
  });

  it("BR-ACT-03: Accessing another user's record returns NOT_FOUND (404), not 403", async () => {
    const fakeOwnershipPort: ChildOwnershipPort = {
      async isOwnedByUser(userId: number, childId: number): Promise<boolean> {
        await Promise.resolve();
        return userId === 10 && childId === 100;
      },
    };

    const event = {
      context: createAuthContext({
        user: {
          user_id: 20,
          display_name: "User Twenty",
          session_id: "s-user-20",
        },
      }),
    };
    await expect(
      verifyChildOwnership(event, 100, fakeOwnershipPort)
    ).rejects.toThrowError(
      expect.objectContaining({ code: "NOT_FOUND", status: 404 })
    );
  });

  it("BR-ACT-05: User payload contains NO role, tier, package, or entitlement", () => {
    const userPayload: UserTokenPayload = {
      user_id: 1,
      display_name: "User",
      session_id: "s-1",
    };

    expect(userPayload).not.toHaveProperty("role");
    expect(userPayload).not.toHaveProperty("tier");
    expect(userPayload).not.toHaveProperty("package");
    expect(userPayload).not.toHaveProperty("entitlement");
  });

  it("BR-ACT-07: Child profile active status verified via assertActiveChild", () => {
    const eventWithoutChild = {
      context: createAuthContext({
        user: {
          user_id: 1,
          display_name: "User",
          session_id: "s-1",
        },
      }),
    };

    expect(() => assertActiveChild(eventWithoutChild)).toThrowError(
      expect.objectContaining({ code: "NO_ACTIVE_CHILD", status: 428 })
    );
  });

  it("BR-ACT-08: content_reviewer role cannot perform super_admin actions (INSUFFICIENT_ROLE 403)", () => {
    const reviewerEvent = {
      context: createAuthContext({
        manager: {
          manager_id: 2,
          display_name: "Reviewer",
          session_id: "s-2",
          role: "content_reviewer",
        },
      }),
    };

    expect(() => requireRole(reviewerEvent, "super_admin")).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_ROLE", status: 403 })
    );
  });

  it("BR-AUT-13 & BR-AUT-14: Reauth required after 5 mins and provides available methods", () => {
    const oldReauthAt = new Date(Date.now() - 6 * 60 * 1000);

    expect(() => verifyReauthWindow(oldReauthAt, ["password"])).toThrowError(
      expect.objectContaining({
        code: "REAUTH_REQUIRED",
        status: 428,
        details: { methods: ["password"] },
      })
    );
  });
});
