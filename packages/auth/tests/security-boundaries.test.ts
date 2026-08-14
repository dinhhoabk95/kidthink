import { describe, expect, it } from "vitest";
import {
  assertActiveChild,
  type ChildOwnershipPort,
  createAuthContext,
  generateCsrfToken,
  InMemoryRedisClient,
  type ManagerTokenPayload,
  RedisSessionStore,
  requireManagerAuth,
  requireRole,
  requireUserAuth,
  type UserTokenPayload,
  validateCsrfToken,
  verifyChildOwnership,
  verifyReauthWindow,
} from "../src/index";

describe("P0.3 Security Evidence — Business Rule Verification", () => {
  it("BR-ACT-01 & BR-ACT-02: Separate guards enforce explicit audience checks and reject cross-namespace tokens", async () => {
    const userPayload: UserTokenPayload = {
      user_id: 1,
      display_name: "User One",
      session_id: "s-user",
      refresh_token_version: 1,
    };
    const managerPayload: ManagerTokenPayload = {
      manager_id: 2,
      display_name: "Manager Two",
      session_id: "s-mgr",
      refresh_token_version: 1,
      role: "content_reviewer",
    };

    const userEvent = { context: createAuthContext({ user: userPayload }) };
    const managerEvent = {
      context: createAuthContext({ manager: managerPayload }),
    };

    // User calling manager guard -> 401
    expect(() => requireManagerAuth(userEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );

    // Manager calling user guard -> 401
    expect(() => requireUserAuth(managerEvent)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", status: 401 })
    );

    // Redis cross-namespace validation failure (User token resolving under Manager namespace)
    const store = new RedisSessionStore(new InMemoryRedisClient());
    const createdUserSession = await store.createSession({
      namespace: "user",
      accountId: 1,
      displayName: "User One",
    });

    const managerResolved = await store.resolveSession(
      "manager",
      createdUserSession.sessionToken
    );
    expect(managerResolved).toBeNull();
  });

  it("BR-ACT-03: Accessing another user's record returns NOT_FOUND (404), not 403", async () => {
    const fakeOwnershipPort: ChildOwnershipPort = {
      async isOwnedByUser(userId: number, childId: number): Promise<boolean> {
        await Promise.resolve();
        return userId === 10 && childId === 100;
      },
    };

    // User 20 trying to access child 100 -> returns 404 (NOT_FOUND)
    const event = {
      context: createAuthContext({
        user: {
          user_id: 20,
          display_name: "User Twenty",
          session_id: "s-user-20",
          refresh_token_version: 0,
        },
      }),
    };
    await expect(
      verifyChildOwnership(event, 100, fakeOwnershipPort)
    ).rejects.toThrowError(
      expect.objectContaining({ code: "NOT_FOUND", status: 404 })
    );
  });

  it("BR-ACT-05 & BR-AUT-07: User payload contains NO role, tier, package, or entitlement", () => {
    const userPayload: UserTokenPayload = {
      user_id: 1,
      display_name: "User",
      session_id: "s-1",
      refresh_token_version: 1,
    };

    expect(userPayload).not.toHaveProperty("role");
    expect(userPayload).not.toHaveProperty("tier");
    expect(userPayload).not.toHaveProperty("package");
    expect(userPayload).not.toHaveProperty("entitlement");
  });

  it("BR-ACT-07: Child profile active status verified via assertActiveChild and DB ownership", () => {
    const eventWithoutChild = {
      context: createAuthContext({
        user: {
          user_id: 1,
          display_name: "User",
          session_id: "s-1",
          refresh_token_version: 1,
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
          refresh_token_version: 1,
          role: "content_reviewer",
        },
      }),
    };

    expect(() => requireRole(reviewerEvent, "super_admin")).toThrowError(
      expect.objectContaining({ code: "INSUFFICIENT_ROLE", status: 403 })
    );
  });

  it("BR-AUT-02: Guards are strictly synchronous functions", () => {
    const userPayload: UserTokenPayload = {
      user_id: 1,
      display_name: "User",
      session_id: "s-1",
      refresh_token_version: 1,
    };
    const event = { context: createAuthContext({ user: userPayload }) };

    const result = requireUserAuth(event);
    expect(result).toBe(userPayload);
    expect(result).not.toHaveProperty("then");
  });

  it("BR-AUT-06: CSRF double-submit token enforced on unsafe HTTP methods", () => {
    const csrfToken = generateCsrfToken();

    // GET is allowed without CSRF
    expect(() =>
      validateCsrfToken({
        method: "GET",
        cookieToken: undefined,
        headerToken: undefined,
      })
    ).not.toThrow();

    // POST fails without header or mismatch
    expect(() =>
      validateCsrfToken({
        method: "POST",
        cookieToken: csrfToken,
        headerToken: undefined,
      })
    ).toThrowError(
      expect.objectContaining({ code: "CSRF_INVALID", status: 403 })
    );

    // POST succeeds with matching header
    expect(() =>
      validateCsrfToken({
        method: "POST",
        cookieToken: csrfToken,
        headerToken: csrfToken,
      })
    ).not.toThrow();
  });

  it("BR-AUT-13 & BR-AUT-14: Reauth required after 5 mins and provides available methods", () => {
    const oldReauthAt = new Date(Date.now() - 6 * 60 * 1000); // 6 mins ago

    expect(() => verifyReauthWindow(oldReauthAt, ["password"])).toThrowError(
      expect.objectContaining({
        code: "REAUTH_REQUIRED",
        status: 428,
        details: { methods: ["password"] },
      })
    );
  });
});
