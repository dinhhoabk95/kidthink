import { hashPassword } from "@mindkid/auth";
import { activeSessions, getOwnerDb, managers } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import deleteManagerSessionHandler from "#server/api/managers/auth/sessions/[id].delete";
import getManagerSessionsHandler from "#server/api/managers/auth/sessions.get";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function buildManagerEvent(options: {
  method: "GET" | "DELETE";
  url: string;
  manager?: {
    manager_id: number;
    display_name: string;
    role: "super_admin" | "content_reviewer";
    session_id: string;
  };
  params?: Record<string, string>;
}): H3Event {
  const req = {
    method: options.method,
    url: options.url,
    headers: {
      host: "mindkid.test",
      "user-agent": "VitestRunner/1.0",
      "x-csrf-token": CSRF_TOKEN,
      cookie: `tm_m_csrf=${CSRF_TOKEN}`,
    },
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    statusCode: 200,
    getHeader: () => undefined,
    setHeader: () => undefined,
  };
  const event = createEvent(req as never, res as never);
  if (options.manager) {
    event.context.manager = options.manager;
  }
  if (options.params) {
    event.context.params = options.params;
  }
  return event;
}

describe("Manager Auth Sessions Routes (Task #305 S1 — BR-AUT-01..10)", () => {
  it("lists only calling manager's active sessions, redacts IP, and marks isCurrent", async () => {
    const db = getOwnerDb();
    const passHash = await hashPassword("ManagerPass123!");
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

    const [managerA] = await db
      .insert(managers)
      .values({
        email: `mgr-sess-a-${suffix}@mindkid.vn`,
        passwordHash: passHash,
        displayName: "Manager A",
        role: "super_admin",
        isActive: true,
        mfaEnabled: true,
      })
      .returning();

    const [managerB] = await db
      .insert(managers)
      .values({
        email: `mgr-sess-b-${suffix}@mindkid.vn`,
        passwordHash: passHash,
        displayName: "Manager B",
        role: "super_admin",
        isActive: true,
        mfaEnabled: true,
      })
      .returning();

    const [s1] = await db
      .insert(activeSessions)
      .values({
        accountType: "manager",
        accountId: managerA.id,
        deviceId: `dev_a1_${suffix}`,
        deviceLabel: "MacBook Pro",
        ipAddress: "203.113.142.88",
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    const [s2] = await db
      .insert(activeSessions)
      .values({
        accountType: "manager",
        accountId: managerA.id,
        deviceId: `dev_a2_${suffix}`,
        deviceLabel: "iPad Air",
        ipAddress: "2001:db8::1",
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    const [sB] = await db
      .insert(activeSessions)
      .values({
        accountType: "manager",
        accountId: managerB.id,
        deviceId: `dev_b1_${suffix}`,
        deviceLabel: "Other Manager Device",
        ipAddress: "10.0.0.1",
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    const getEvent = buildManagerEvent({
      method: "GET",
      url: "/api/managers/auth/sessions",
      manager: {
        manager_id: managerA.id,
        display_name: managerA.displayName,
        role: "super_admin",
        session_id: String(s1.id),
      },
    });

    const result = await getManagerSessionsHandler(getEvent);
    expect(result.sessions).toHaveLength(2);

    const currentItem = result.sessions.find((s) => s.id === String(s1.id));
    const secondItem = result.sessions.find((s) => s.id === String(s2.id));
    const otherManagerItem = result.sessions.find(
      (s) => s.id === String(sB.id)
    );

    expect(currentItem).toBeDefined();
    expect(currentItem?.isCurrent).toBe(true);
    expect(currentItem?.ipAddress).toBe("203.113.x.x");

    expect(secondItem).toBeDefined();
    expect(secondItem?.isCurrent).toBe(false);
    expect(secondItem?.ipAddress).toBe("IPv6");

    expect(otherManagerItem).toBeUndefined();
  });

  it("revokes own session and returns 404 NotFoundError when attempting to delete another manager's session", async () => {
    const db = getOwnerDb();
    const passHash = await hashPassword("ManagerPass123!");
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

    const [managerA] = await db
      .insert(managers)
      .values({
        email: `mgr-del-a-${suffix}@mindkid.vn`,
        passwordHash: passHash,
        displayName: "Manager Del A",
        role: "super_admin",
        isActive: true,
        mfaEnabled: true,
      })
      .returning();

    const [managerB] = await db
      .insert(managers)
      .values({
        email: `mgr-del-b-${suffix}@mindkid.vn`,
        passwordHash: passHash,
        displayName: "Manager Del B",
        role: "super_admin",
        isActive: true,
        mfaEnabled: true,
      })
      .returning();

    const [sessA1] = await db
      .insert(activeSessions)
      .values({
        accountType: "manager",
        accountId: managerA.id,
        deviceId: `dev_del_a1_${suffix}`,
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    const [sessA2] = await db
      .insert(activeSessions)
      .values({
        accountType: "manager",
        accountId: managerA.id,
        deviceId: `dev_del_a2_${suffix}`,
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    const [sessB1] = await db
      .insert(activeSessions)
      .values({
        accountType: "manager",
        accountId: managerB.id,
        deviceId: `dev_del_b1_${suffix}`,
        authMethod: "password",
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();

    // 1. Delete own second session (sessA2) -> succeeds
    const deleteOwnEvent = buildManagerEvent({
      method: "DELETE",
      url: `/api/managers/auth/sessions/${sessA2.id}`,
      manager: {
        manager_id: managerA.id,
        display_name: managerA.displayName,
        role: "super_admin",
        session_id: String(sessA1.id),
      },
      params: { id: String(sessA2.id) },
    });

    const delRes = await deleteManagerSessionHandler(deleteOwnEvent);
    expect(delRes.ok).toBe(true);

    const remainingA = await db
      .select()
      .from(activeSessions)
      .where(
        and(
          eq(activeSessions.accountType, "manager"),
          eq(activeSessions.accountId, managerA.id)
        )
      );
    expect(remainingA).toHaveLength(1);
    expect(remainingA[0]?.id).toBe(sessA1.id);

    // 2. Negative case: Manager A tries to delete Manager B's session (sessB1) -> 404 NOT_FOUND
    const deleteOtherEvent = buildManagerEvent({
      method: "DELETE",
      url: `/api/managers/auth/sessions/${sessB1.id}`,
      manager: {
        manager_id: managerA.id,
        display_name: managerA.displayName,
        role: "super_admin",
        session_id: String(sessA1.id),
      },
      params: { id: String(sessB1.id) },
    });

    await expect(
      deleteManagerSessionHandler(deleteOtherEvent)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });

    // Manager B's session must still exist intact
    const remainingB = await db
      .select()
      .from(activeSessions)
      .where(
        and(
          eq(activeSessions.accountType, "manager"),
          eq(activeSessions.accountId, managerB.id)
        )
      );
    expect(remainingB).toHaveLength(1);
    expect(remainingB[0]?.id).toBe(sessB1.id);
  });
});
