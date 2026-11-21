import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import { getOwnerDb, managers } from "@mindkid/db";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getManagerAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

async function createAndSignInManager(tag: string) {
  const db = getOwnerDb();
  const email = `mgr-sess-${tag}-${Date.now()}-${Math.floor(Math.random() * 100_000)}@mindkid.vn`;
  const password = "ManagerPass123!";
  const ctx = await getManagerAuth().$context;
  const passwordHash = await ctx.password.hash(password);

  const [mgr] = await db
    .insert(managers)
    .values({
      email,
      passwordHash,
      displayName: `Manager ${tag}`,
      role: "super_admin",
      isActive: true,
      mfaEnabled: false,
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

  const s1Res = await getManagerAuth().handler(
    new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "user-agent": `${tag}-Device-1`,
      },
      body: JSON.stringify({ email, password }),
    })
  );
  const s2Res = await getManagerAuth().handler(
    new Request("http://localhost:3000/api/auth/managers/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "user-agent": `${tag}-Device-2`,
      },
      body: JSON.stringify({ email, password }),
    })
  );

  return {
    managerId: mgr.id,
    cookie1: collectCookie(s1Res),
    cookie2: collectCookie(s2Res),
  };
}

describe("Manager Better Auth Multi-Session Isolation (BR-AUT-01..10, BR-AUT-39..45)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("lists only calling manager's active sessions and never leaks another manager's sessions", async () => {
    const mgrA = await createAndSignInManager("A");
    const mgrB = await createAndSignInManager("B");

    const listA = await getManagerAuth().api.listSessions({
      headers: new Headers({ cookie: mgrA.cookie1 }),
    });
    expect(listA).toHaveLength(2);
    for (const s of listA) {
      expect(Number(s.userId)).toBe(mgrA.managerId);
      expect(Number(s.userId)).not.toBe(mgrB.managerId);
    }
  });

  it("revokes own second session and refuses to revoke another manager's session token", async () => {
    const mgrA = await createAndSignInManager("DelA");
    const mgrB = await createAndSignInManager("DelB");

    const listBeforeA = await getManagerAuth().api.listSessions({
      headers: new Headers({ cookie: mgrA.cookie1 }),
    });
    const listBeforeB = await getManagerAuth().api.listSessions({
      headers: new Headers({ cookie: mgrB.cookie1 }),
    });
    expect(listBeforeA).toHaveLength(2);
    expect(listBeforeB).toHaveLength(2);

    const secondA = listBeforeA.find((s) => s.userAgent?.includes("Device-2"));
    const targetB = listBeforeB[0];
    if (!(secondA && targetB)) {
      throw new Error("Expected sessions");
    }

    const revokeOwnRes = await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/revoke-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie: mgrA.cookie1,
        },
        body: JSON.stringify({ token: secondA.token }),
      })
    );
    expect(revokeOwnRes.status).toBe(200);

    const listAfterA = await getManagerAuth().api.listSessions({
      headers: new Headers({ cookie: mgrA.cookie1 }),
    });
    expect(listAfterA).toHaveLength(1);

    await getManagerAuth().handler(
      new Request("http://localhost:3000/api/auth/managers/revoke-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie: mgrA.cookie1,
        },
        body: JSON.stringify({ token: targetB.token }),
      })
    );

    const listAfterB = await getManagerAuth().api.listSessions({
      headers: new Headers({ cookie: mgrB.cookie1 }),
    });
    expect(listAfterB).toHaveLength(2);
  });
});
