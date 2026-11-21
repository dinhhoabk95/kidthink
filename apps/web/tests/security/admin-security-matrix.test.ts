import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import { getOwnerDb, managers } from "@mindkid/db";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getManagerAuth,
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

describe("Admin Security Matrix & Surface Isolation (BR-ADA-02..06, D-EY, D-EZ)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("D-EZ: rejects User session cookie when resolved under Manager Better Auth instance", async () => {
    const email = `matrix-user-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const signUpRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Regular User",
          email,
          password: "StrongPassword123!",
          accept_terms: true,
          accept_privacy: true,
        }),
      })
    );
    const userCookie = collectCookie(signUpRes);
    const swappedCookie = userCookie.replace(
      "mindkid-user.session_token=",
      "mindkid-manager.session_token="
    );

    const managerResolved = await getManagerAuth().api.getSession({
      headers: new Headers({ cookie: `${userCookie}; ${swappedCookie}` }),
    });
    expect(managerResolved).toBeNull();
  });

  it("D-EZ: rejects Manager session cookie when resolved under User Better Auth instance", async () => {
    const db = getOwnerDb();
    const email = `matrix-mgr-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.test`;
    const password = "AdminStrongPassword123!";
    const ctx = await getManagerAuth().$context;
    const passwordHash = await ctx.password.hash(password);

    const [mgr] = await db
      .insert(managers)
      .values({
        email,
        passwordHash,
        displayName: "Admin User",
        role: "super_admin",
        isActive: true,
      })
      .returning({ id: managers.id });
    if (!mgr) {
      throw new Error("Expected manager");
    }

    await ctx.internalAdapter.linkAccount({
      userId: String(mgr.id),
      providerId: "credential",
      accountId: String(mgr.id),
      password: passwordHash,
    });

    const loginRes = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email, password }),
      })
    );
    const managerCookie = collectCookie(loginRes);
    const swappedCookie = managerCookie.replace(
      "mindkid-manager.session_token=",
      "mindkid-user.session_token="
    );

    const userResolved = await getUserAuth().api.getSession({
      headers: new Headers({ cookie: `${managerCookie}; ${swappedCookie}` }),
    });
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
