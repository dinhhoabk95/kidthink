import {
  auditLogs,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  managers,
  notifications,
  packages,
  paymentOrders,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import revokeHandler from "../../../server/api/managers/entitlements/[id].delete";
import grantHandler from "../../../server/api/managers/users/[uuid]/entitlements.post";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function mockManagerEvent(
  managerRole?: "super_admin" | "content_reviewer",
  body?: unknown,
  params?: Record<string, string>,
  method = "POST"
) {
  return {
    method,
    node: {
      req: {
        headers: {
          "user-agent": "Vitest-Test-Agent",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
        socket: { remoteAddress: "127.0.0.1" },
      },
      res: {},
    },
    context: {
      params: params || {},
      ...(managerRole
        ? {
            manager: {
              manager_id: 999,
              display_name: "Test Super Admin",
              session_id: "sess_test_sa",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
    },
    _body: body,
  } as any;
}

describe("Task 2 — Manual Entitlement Grant & Revoke Suite (BR-EGR-01..08, D-JM, D-JN, D-JO)", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
  });

  it("Scenario: unauthenticated request is rejected with 401", async () => {
    const event = mockManagerEvent(undefined, {
      package_code: "PKG-standard",
      duration_days: 30,
      grant_reason: "Cấp quyền sử dụng 30 ngày cho đối tác.",
    });
    await expect(grantHandler(event)).rejects.toThrow();
  });

  it("Scenario: BR-EGR-05 — content_reviewer is rejected with 403 INSUFFICIENT_ROLE", async () => {
    const event = mockManagerEvent(
      "content_reviewer",
      {
        package_code: "PKG-standard",
        duration_days: 30,
        grant_reason: "Cấp quyền sử dụng 30 ngày cho đối tác.",
      },
      { uuid: "any-uuid" }
    );
    try {
      await grantHandler(event);
      expect.fail("Should have thrown 403");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("Scenario: D-JN — schema strictly rejects unexpected fields (entitlement_key) with 422", async () => {
    const event = mockManagerEvent(
      "super_admin",
      {
        package_code: "PKG-standard",
        entitlement_key: "play_standard_games",
        duration_days: 30,
        grant_reason: "Cấp quyền sử dụng 30 ngày cho đối tác.",
      },
      { uuid: "any-uuid" }
    );
    try {
      await grantHandler(event);
      expect.fail("Should have thrown 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("Scenario: BR-EGR-02 — rejects grant_reason shorter than 20 characters with 422", async () => {
    const event = mockManagerEvent(
      "super_admin",
      {
        package_code: "PKG-standard",
        duration_days: 30,
        grant_reason: "Lý do ngắn",
      },
      { uuid: "any-uuid" }
    );
    try {
      await grantHandler(event);
      expect.fail("Should have thrown 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("Scenario: BR-EGR-04 — rejects duration_days > 365 or < 1 with 422", async () => {
    const eventTooLong = mockManagerEvent(
      "super_admin",
      {
        package_code: "PKG-standard",
        duration_days: 3650,
        grant_reason: "Cấp quyền sử dụng 10 năm cho đối tác.",
      },
      { uuid: "any-uuid" }
    );
    try {
      await grantHandler(eventTooLong);
      expect.fail("Should have thrown 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }

    const eventZero = mockManagerEvent(
      "super_admin",
      {
        package_code: "PKG-standard",
        duration_days: 0,
        grant_reason: "Cấp quyền sử dụng 0 ngày cho đối tác.",
      },
      { uuid: "any-uuid" }
    );
    try {
      await grantHandler(eventZero);
      expect.fail("Should have thrown 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }
  });

  it("Scenario: rejects unknown package_code with 404 PACKAGE_NOT_FOUND", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `user-unknown-pkg-${Date.now()}@example.com`,
        displayName: "User Unknown Pkg",
      })
      .returning();

    const event = mockManagerEvent(
      "super_admin",
      {
        package_code: "PKG-non_existent",
        duration_days: 30,
        grant_reason: "Cấp quyền gói không tồn tại trong hệ thống.",
      },
      { uuid: user.uuid }
    );
    try {
      await grantHandler(event);
      expect.fail("Should have thrown 404");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(404);
    }
  });

  it("Scenario: grants unreleased add-on (PKG-addon_lesson_plan), stacks expiry, records audit and NO payment order (BR-EGR-01..08, D-JO)", async () => {
    const db = getOwnerDb();

    // Ensure manager exists in managers table for FK
    const [mgr] = await db
      .insert(managers)
      .values({
        email: `mgr-grant-${Date.now()}@example.com`,
        displayName: "Admin Grant Master",
        role: "super_admin",
        passwordHash: "hash-mock-123456",
      })
      .returning();

    // Create target user
    const [user] = await db
      .insert(users)
      .values({
        email: `user-grant-${Date.now()}@example.com`,
        displayName: "Target Grant User",
      })
      .returning();

    // Initial grant: PKG-addon_lesson_plan for 50 days
    const event1 = mockManagerEvent(
      "super_admin",
      {
        package_code: "PKG-addon_lesson_plan",
        duration_days: 50,
        grant_reason: "Cấp add-on giáo án 50 ngày cho đối tác sư phạm.",
        notify_user: true,
      },
      { uuid: user.uuid }
    );
    event1.context.manager.manager_id = mgr.id;

    const res1 = await grantHandler(event1);
    expect(res1).toBeDefined();
    expect(res1.entitlements.length).toBeGreaterThanOrEqual(1);

    // Verify entitlements in DB
    const userEnts1 = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, user.id),
          eq(entitlements.entitlementKey, "create_lesson_plan")
        )
      );

    expect(userEnts1).toHaveLength(1);
    expect(userEnts1[0].source).toBe("manual_grant");
    expect(userEnts1[0].status).toBe("active");
    const initialExpiry = new Date(userEnts1[0].expiresAt ?? 0).getTime();

    // BR-EGR-08 & D-JO: verify NO payment_orders were created!
    const orders = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.userId, user.id));
    expect(orders).toHaveLength(0);

    // Verify user notification was created
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(notifs.length).toBeGreaterThanOrEqual(1);

    // BR-EGR-07: Second grant extends/stacks by 100 days from remaining days
    const event2 = mockManagerEvent(
      "super_admin",
      {
        package_code: "PKG-addon_lesson_plan",
        duration_days: 100,
        grant_reason: "Gia hạn thêm 100 ngày cho đối tác vì sự cố hệ thống.",
        notify_user: false,
      },
      { uuid: user.uuid }
    );
    event2.context.manager.manager_id = mgr.id;

    await grantHandler(event2);

    const [userEnts2] = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, user.id),
          eq(entitlements.entitlementKey, "create_lesson_plan")
        )
      );

    const stackedExpiry = new Date(userEnts2.expiresAt ?? 0).getTime();
    // stackedExpiry should be ~ 100 days (8,640,000,000 ms) after initialExpiry
    const diffMs = stackedExpiry - initialExpiry;
    expect(diffMs).toBeGreaterThanOrEqual(99 * 86_400_000);
    expect(diffMs).toBeLessThanOrEqual(101 * 86_400_000);

    // BR-EGR-03: Verify audit_logs recorded
    const auditEntries = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "entitlement_granted"),
          eq(auditLogs.entityId, String(user.id))
        )
      );
    expect(auditEntries.length).toBeGreaterThanOrEqual(2);
    expect(auditEntries[0].reason).toContain("Cấp add-on giáo án");

    // Test Revocation: DELETE /api/managers/entitlements/[id]
    const revokeEvent = mockManagerEvent(
      "super_admin",
      {
        reason: "Thu hồi quyền do phát hiện vi phạm điều khoản hợp tác.",
      },
      { id: String(userEnts2.id) },
      "DELETE"
    );
    revokeEvent.context.manager.manager_id = mgr.id;

    const revokeRes = await revokeHandler(revokeEvent);
    expect(revokeRes.status).toBe("cancelled");
    expect(revokeRes.id).toBe(userEnts2.id);

    // Verify status updated to cancelled in DB
    const [revokedRow] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, userEnts2.id));
    expect(revokedRow.status).toBe("cancelled");

    // BR-EGR-03: Verify audit_logs recorded entitlement_revoked
    const revokeAudit = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "entitlement_revoked"),
          eq(auditLogs.entityId, String(userEnts2.id))
        )
      );
    expect(revokeAudit.length).toBeGreaterThanOrEqual(1);
    expect(revokeAudit[0].reason).toContain(
      "Thu hồi quyền do phát hiện vi phạm"
    );
  });
});
