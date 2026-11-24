import { InMemoryRedisClient, setAuthRedisClient } from "@mindkid/auth";
import {
  AUTH_METHOD,
  getOwnerDb,
  USER_STATUS_CODEC,
  userSessions,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getUserAuth,
  resetBetterAuthInstancesForTests,
} from "#server/utils/better-auth";

interface SignInResponsePayload {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  code?: string;
}

function collectCookie(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((raw) => raw.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.length > 0 && !pair.endsWith("="))
    .join("; ");
}

async function seedUserWithPassword(
  tag: string,
  status: "active" | "suspended" | "deleted" = "active",
  password = "chuoixanh123"
) {
  const db = getOwnerDb();
  const email = `login-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;
  const ctx = await getUserAuth().$context;
  const passwordHash = await ctx.password.hash(password);

  const [createdUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: `Login User ${tag}`,
      status: USER_STATUS_CODEC.toCode(status),
      emailVerified: true,
      emailVerifiedAt: new Date(),
    })
    .returning();
  if (!createdUser) {
    throw new Error("Expected created user");
  }

  await ctx.internalAdapter.linkAccount({
    userId: String(createdUser.id),
    providerId: "credential",
    accountId: String(createdUser.id),
    password: passwordHash,
  });

  return { user: createdUser, email, password };
}

function postSignIn(
  email: string,
  password: string,
  userAgent = "MindKidTest/1.0",
  rememberMe = false
): Promise<Response> {
  return getUserAuth().handler(
    new Request("http://localhost:3000/api/auth/users/sign-in/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "user-agent": userAgent,
      },
      body: JSON.stringify({ email, password, rememberMe }),
    })
  );
}

describe("Task 3 — Better Auth Login & Session Management (BR-LGN-01..12)", () => {
  beforeEach(() => {
    setAuthRedisClient(new InMemoryRedisClient());
    resetBetterAuthInstancesForTests();
  });

  it("authenticates valid credentials and creates user_sessions row + mindkid-user cookie (BR-LGN-01, BR-LGN-06)", async () => {
    const db = getOwnerDb();
    const { user, email, password } = await seedUserWithPassword("ok");

    const res = await postSignIn(email, password, "Device-1", false);
    expect(res.status).toBe(200);
    const cookie = collectCookie(res);
    expect(cookie).toContain("mindkid-user.session_token=");

    const body = (await res.json()) as SignInResponsePayload;
    expect(body.user?.name).toBe("Login User ok");

    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, user.id));
    expect(session).toBeDefined();
    expect(session?.authMethod).toBe(AUTH_METHOD.PASSWORD);
    expect(session?.reauthAt).toBeInstanceOf(Date);
  });

  it("rejects wrong password or unknown email with 401 INVALID_CREDENTIALS and blocks suspended/deleted accounts (BR-LGN-02..04)", async () => {
    const { email } = await seedUserWithPassword("wrong");

    const wrongPassRes = await postSignIn(email, "wrongpassword123");
    expect(wrongPassRes.status).toBe(401);

    const noUserRes = await postSignIn(
      `nonexistent-${Date.now()}@example.com`,
      "chuoixanh123"
    );
    expect(noUserRes.status).toBe(401);
    const noUserBody = (await noUserRes.json()) as SignInResponsePayload;
    expect(noUserBody.code).toBe("INVALID_CREDENTIALS");

    const suspended = await seedUserWithPassword("susp", "suspended");
    const suspRes = await postSignIn(suspended.email, suspended.password);
    expect(suspRes.status).toBe(403);
    const suspBody = (await suspRes.json()) as SignInResponsePayload;
    expect(suspBody.code).toBe("ACCOUNT_SUSPENDED");

    const deleted = await seedUserWithPassword("del", "deleted");
    const delRes = await postSignIn(deleted.email, deleted.password);
    expect(delRes.status).toBe(403);
    const delBody = (await delRes.json()) as SignInResponsePayload;
    expect(delBody.code).toBe("ACCOUNT_DELETED");
  });

  it("lists sessions, revokes single session, and revokes all sessions via Better Auth (BR-LGN-07..10)", async () => {
    const db = getOwnerDb();
    const { user, email, password } = await seedUserWithPassword("multi");

    const s1Res = await postSignIn(email, password, "Device-One");
    const s2Res = await postSignIn(email, password, "Device-Two");
    const cookie1 = collectCookie(s1Res);
    const cookie2 = collectCookie(s2Res);
    expect(cookie1).toBeTruthy();
    expect(cookie2).toBeTruthy();

    const listBefore = await getUserAuth().api.listSessions({
      headers: new Headers({ cookie: cookie1 }),
    });
    expect(listBefore).toHaveLength(2);

    const secondSession = listBefore.find((s) =>
      s.userAgent?.includes("Device-Two")
    );
    if (!secondSession) {
      throw new Error("Expected second session");
    }

    const revokeOneRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/revoke-session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie: cookie1,
        },
        body: JSON.stringify({ token: secondSession.token }),
      })
    );
    expect(revokeOneRes.status).toBe(200);

    const listAfterOne = await getUserAuth().api.listSessions({
      headers: new Headers({ cookie: cookie1 }),
    });
    expect(listAfterOne).toHaveLength(1);
    expect(listAfterOne[0]?.userAgent).toContain("Device-One");

    await postSignIn(email, password, "Device-Three");
    const revokeAllRes = await getUserAuth().handler(
      new Request("http://localhost:3000/api/auth/users/revoke-sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          cookie: cookie1,
        },
        body: JSON.stringify({}),
      })
    );
    expect(revokeAllRes.status).toBe(200);

    const remainingDbSessions = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, user.id));
    expect(remainingDbSessions).toHaveLength(0);
  });
});
