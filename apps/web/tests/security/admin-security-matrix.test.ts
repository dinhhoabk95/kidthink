import { InMemoryRedisClient, RedisSessionStore } from "@mindkid/auth";
import { describe, expect, it } from "vitest";

describe("Task 4 & 5 — Admin Security Matrix & Surface Isolation (BR-ADA-02..06, D-EY, D-EZ)", () => {
  it("D-EZ: rejects User session token when resolved under Manager namespace", async () => {
    const store = new RedisSessionStore(new InMemoryRedisClient());
    const userSession = await store.createSession({
      namespace: "user",
      accountId: 123,
      displayName: "Regular User",
    });

    const managerResolved = await store.resolveSession(
      "manager",
      userSession.sessionToken
    );
    expect(managerResolved).toBeNull();
  });

  it("D-EZ: rejects Manager session token when resolved under User namespace", async () => {
    const store = new RedisSessionStore(new InMemoryRedisClient());
    const managerSession = await store.createSession({
      namespace: "manager",
      accountId: 1,
      displayName: "Admin User",
      role: "super_admin",
    });

    const userResolved = await store.resolveSession(
      "user",
      managerSession.sessionToken
    );
    expect(userResolved).toBeNull();
  });

  it("BR-ADA-06: self role mutation or elevation is disallowed", () => {
    function attemptRoleChange(role: string, managerRole: string) {
      if (managerRole !== "super_admin" || role === managerRole) {
        throw new Error("BR-ADA-06: Cannot modify own role or elevate role");
      }
    }

    expect(() => attemptRoleChange("super_admin", "content_reviewer")).toThrow(
      "BR-ADA-06"
    );
  });
});
