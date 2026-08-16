import {
  auditLogs,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  users,
} from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import reactivateHandler from "../../../server/api/managers/users/[uuid]/reactivate.post";
import sendPasswordResetHandler from "../../../server/api/managers/users/[uuid]/send-password-reset.post";
import suspendHandler from "../../../server/api/managers/users/[uuid]/suspend.post";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  userUuid?: string,
  body?: unknown
) {
  return {
    method: "POST",
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
        url: `/api/managers/users/${userUuid}/op`,
      },
      res: {},
    },
    context: {
      params: { uuid: userUuid },
      body,
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Super Admin",
              session_id: "sess_mgr_1",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 3 — User Ops: Suspend, Reactivate, Send Password Reset (BR-USM-03, BR-USM-04, BR-USM-05, BR-USM-08, D-JE)", () => {
  it("BR-USM-03: rejects suspend with reason < 10 characters with 422 ADMIN_NOTE_REQUIRED and preserves active status", async () => {
    const db = getOwnerDb();
    const testEmail = `test_suspend_val_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Suspend Validation User",
        status: "active",
      })
      .returning();

    // Short reason (< 10 chars)
    const event = mockEvent("super_admin", user.uuid, { reason: "short" });

    try {
      await suspendHandler(event);
      expect.fail("Should have thrown 422");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
    }

    // Verify user remained active
    const [fetched] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(fetched.status).toBe("active");
  });

  it("D-JE, BR-USM-04 & BR-USM-05: suspend revokes sessions (sessionVersion + 1), preserves entitlements, and reactivate restores access", async () => {
    const db = getOwnerDb();
    const testEmail = `test_ops_pair_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Ops Pair User",
        status: "active",
        sessionVersion: 1,
      })
      .returning();

    // Ensure entitlement key exists
    await db
      .insert(entitlementKeys)
      .values({
        key: "content.standard",
        group: "content",
        labelVi: "Nội dung chuẩn",
      })
      .onConflictDoNothing();

    // Seed entitlement for user
    const [entitlement] = await db
      .insert(entitlements)
      .values({
        userId: user.id,
        entitlementKey: "content.standard",
        source: "manual_grant",
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 86_400 * 1000),
      })
      .returning();

    // Step 1: Suspend user
    const suspendReason = "Tài khoản có dấu hiệu vi phạm điều khoản";
    const suspendEvent = mockEvent("super_admin", user.uuid, {
      reason: suspendReason,
    });
    const suspendRes = await suspendHandler(suspendEvent);
    expect(suspendRes.success).toBe(true);
    expect(suspendRes.status).toBe("suspended");

    // Verify sessionVersion increased to revoke sessions (BR-USM-05)
    const [suspendedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(suspendedUser.status).toBe("suspended");
    expect(suspendedUser.sessionVersion).toBe(2);
    expect(suspendedUser.suspendedReason).toBe(suspendReason);

    // Verify entitlement is NOT modified or revoked (BR-USM-04)
    const [checkedEntitlement] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, entitlement.id));
    expect(checkedEntitlement.status).toBe("active");
    expect(checkedEntitlement.expiresAt?.getTime()).toBe(
      entitlement.expiresAt?.getTime()
    );

    // Verify audit log recorded
    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, user.uuid),
          eq(auditLogs.action, "manager.user.suspended")
        )
      );
    expect(auditLog).toBeDefined();
    expect(auditLog.reason).toBe(suspendReason);

    // Step 2: Reactivate user
    const reactivateReason = "Phụ huynh đã giải trình và xác minh hợp lệ";
    const reactivateEvent = mockEvent("super_admin", user.uuid, {
      reason: reactivateReason,
    });
    const reactivateRes = await reactivateHandler(reactivateEvent);
    expect(reactivateRes.success).toBe(true);
    expect(reactivateRes.status).toBe("active");

    const [restoredUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    expect(restoredUser.status).toBe("active");
    expect(restoredUser.suspendedReason).toBeNull();
  });

  it("BR-USM-08: send-password-reset triggers reset email without leaking token in response", async () => {
    const db = getOwnerDb();
    const testEmail = `test_pw_reset_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Reset Password Target",
        status: "active",
      })
      .returning();

    const event = mockEvent("super_admin", user.uuid);
    const res = await sendPasswordResetHandler(event);

    expect(res.success).toBe(true);
    // BR-USM-08: Token MUST NOT be returned in response to manager
    expect((res as any).token).toBeUndefined();
    expect((res as any).rawToken).toBeUndefined();
    expect((res as any).reset_link).toBeUndefined();
  });

  it("rejects operations on deleted user with 409 USER_ALREADY_DELETED", async () => {
    const db = getOwnerDb();
    const testEmail = `test_deleted_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Deleted User",
        status: "deleted",
      })
      .returning();

    const suspendEvent = mockEvent("super_admin", user.uuid, {
      reason: "Reason for deleted user",
    });
    await expect(suspendHandler(suspendEvent)).rejects.toThrow();

    const resetEvent = mockEvent("super_admin", user.uuid);
    await expect(sendPasswordResetHandler(resetEvent)).rejects.toThrow();
  });
});
