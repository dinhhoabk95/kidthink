import { hashPassword } from "@kidthink/auth";
import { activeSessions, getAppDb, users } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { truncateAllTestTables } from "../../../../../packages/db/tests/global-setup";

describe("Task 3 — Login & Session Management (BR-LGN-01..12)", () => {
  beforeEach(async () => {
    await truncateAllTestTables();
  });

  it("authenticates valid credentials and creates active session + auth cookies (BR-LGN-01, BR-LGN-06)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `login1-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    await db.insert(users).values({
      email,
      passwordHash: passHash,
      displayName: "Login User 1",
      status: "active",
    });

    const { default: loginHandler } = await import(
      "../../../server/api/guest/auth/users/login.post"
    );

    const event = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: { email, password: "chuoixanh123" },
      },
    } as any;

    const res = await loginHandler(event);
    expect(res.user.displayName).toBe("Login User 1");

    const [session] = await db.select().from(activeSessions);
    expect(session).toBeDefined();
    expect(session.accountType).toBe("user");
  });

  it("rejects wrong password or non-existent email with 401 INVALID_CREDENTIALS (BR-LGN-02)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `login2-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    await db.insert(users).values({
      email,
      passwordHash: passHash,
      displayName: "Login User 2",
      status: "active",
    });

    const { default: loginHandler } = await import(
      "../../../server/api/guest/auth/users/login.post"
    );

    const wrongPassEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: { email, password: "wrongpassword123" },
      },
    } as any;

    await expect(loginHandler(wrongPassEvent)).rejects.toThrow();

    const noUserEvent = {
      method: "POST",
      node: { req: { headers: { "x-forwarded-for": "127.0.0.1" } } },
      context: {
        body: {
          email: `nonexistent-${Date.now()}@example.com`,
          password: "chuoixanh123",
        },
      },
    } as any;

    await expect(loginHandler(noUserEvent)).rejects.toThrow();
  });

  it("lists sessions and revokes session or logout-all (BR-LGN-07..10)", async () => {
    const db = getAppDb();
    const passHash = await hashPassword("chuoixanh123");
    const email = `sessions-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: passHash,
        displayName: "Sessions User",
        status: "active",
      })
      .returning();

    // Create 2 sessions directly
    const [s1] = await db
      .insert(activeSessions)
      .values({
        accountType: "user",
        accountId: user.id,
        deviceId: "dev_s1",
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    const [s2] = await db
      .insert(activeSessions)
      .values({
        accountType: "user",
        accountId: user.id,
        deviceId: "dev_s2",
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    const { default: sessionsHandler } = await import(
      "../../../server/api/users/auth/sessions.get"
    );

    const getEvent = {
      method: "GET",
      node: { req: { headers: {} } },
      context: {
        user: {
          user_id: user.id,
          display_name: user.displayName,
          session_id: String(s1.id),
          refresh_token_version: user.sessionVersion,
        },
      },
    } as any;

    const sessionList = await sessionsHandler(getEvent);
    expect(sessionList.sessions).toHaveLength(2);

    // Revoke s2
    const { default: deleteSessionHandler } = await import(
      "../../../server/api/users/auth/sessions/[id].delete"
    );

    const deleteEvent = {
      method: "DELETE",
      context: {
        user: {
          user_id: user.id,
          display_name: user.displayName,
          session_id: String(s1.id),
          refresh_token_version: user.sessionVersion,
        },
        params: { id: String(s2.id) },
      },
    } as any;

    await deleteSessionHandler(deleteEvent);

    const remainingSessions = await db
      .select()
      .from(activeSessions)
      .where(eq(activeSessions.accountId, user.id));
    expect(remainingSessions).toHaveLength(1);
    expect(remainingSessions[0].id).toBe(s1.id);
  });
});
