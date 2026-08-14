import {
  auditLogs,
  childProfiles,
  getOwnerDb,
  packages,
  paymentOrders,
  users,
} from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import handler from "../../../server/api/managers/users/[uuid].get";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  userUuid?: string
) {
  const headers: Record<string, string> = {
    "user-agent": "VitestTestRunner/1.0",
  };
  return {
    method: "GET",
    node: {
      req: {
        headers,
        url: `/api/managers/users/${userUuid}`,
      },
      res: {
        setHeader: (name: string, value: string) => {
          headers[name.toLowerCase()] = value;
        },
      },
    },
    context: {
      params: { uuid: userUuid },
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

describe("Task 4 — GET /api/managers/users/[uuid] Detail (BR-USD-01, BR-USD-04, BR-USD-05, BR-USD-06, BR-CPA-03, D-JD, D-JF)", () => {
  it("rejects unauthenticated request with 401 and content_reviewer with 403", async () => {
    const unauthEvent = mockEvent(undefined, "some-uuid");
    await expect(handler(unauthEvent)).rejects.toThrow();

    const reviewerEvent = mockEvent("content_reviewer", "some-uuid");
    try {
      await handler(reviewerEvent);
      expect.fail("Should have thrown 403");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("returns 404 for non-existent user UUID", async () => {
    const event = mockEvent(
      "super_admin",
      "00000000-0000-0000-0000-000000000000"
    );
    try {
      await handler(event);
      expect.fail("Should have thrown 404");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(404);
    }
  });

  it("D-JF, BR-USD-01, BR-USD-04 & BR-CPA-03: returns 4 groups with projected child profiles and NO child learning telemetry or auth secrets", async () => {
    const db = getOwnerDb();
    const testEmail = `test_detail_${Date.now()}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Detail Test Parent",
        status: "active",
        passwordHash: "super-secret-hash",
      })
      .returning();

    // Insert child profile
    await db.insert(childProfiles).values({
      userId: user.id,
      displayName: "Bé Bình",
      birthYear: 2021,
      avatarId: "avatar-preset-03",
      status: "active",
    });

    const event = mockEvent("super_admin", user.uuid);
    const res = await handler(event);

    expect(res).toBeDefined();
    expect(res.account).toBeDefined();
    expect(res.child_profiles).toBeDefined();
    expect(res.entitlements).toBeDefined();
    expect(res.payments).toBeDefined();

    // Group 1: Account
    expect(res.account.email).toBe(testEmail);
    expect(res.account.display_name).toBe("Detail Test Parent");
    // BR-USD-04: STRICTLY no password_hash or secret tokens in response
    expect((res.account as any).password_hash).toBeUndefined();
    expect((res.account as any).passwordHash).toBeUndefined();
    expect(JSON.stringify(res)).not.toContain("super-secret-hash");

    // Group 2: Child Profiles
    expect(res.child_profiles.length).toBe(1);
    const child = res.child_profiles[0];
    expect(child.display_name).toBe("Bé Bình");
    expect(child.age_band).toBeDefined();
    expect(child.status).toBe("active");
    expect(child.created_at).toBeDefined();

    // BR-USD-01 & BR-CPA-03: STRICTLY no birth_year, avatar_id, mastery, telemetry, play_session, p_learn
    expect((child as any).birth_year).toBeUndefined();
    expect((child as any).birthYear).toBeUndefined();
    expect((child as any).avatar_id).toBeUndefined();
    expect((child as any).avatarId).toBeUndefined();
    expect((child as any).mastery).toBeUndefined();
    expect((child as any).telemetry).toBeUndefined();
    expect((child as any).play_session).toBeUndefined();
    expect((child as any).p_learn).toBeUndefined();
  });

  it("BR-USD-06: returns complete payment order history including approved and rejected orders", async () => {
    const db = getOwnerDb();
    const testEmail = `test_detail_pay_${Date.now()}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Payment History Parent",
        status: "active",
      })
      .returning();

    // Ensure package exists
    await db
      .insert(packages)
      .values({
        code: "PKG_TEST_STD",
        nameVi: "Gói chuẩn",
        audienceVi: "Phụ huynh",
        offers: [],
      })
      .onConflictDoNothing();

    // 1 approved + 2 rejected payment orders
    await db.insert(paymentOrders).values([
      {
        userId: user.id,
        packageCode: "PKG_TEST_STD",
        offerCode: "OFFER_1M",
        amountVnd: 150_000,
        status: "approved",
      },
      {
        userId: user.id,
        packageCode: "PKG_TEST_STD",
        offerCode: "OFFER_1M",
        amountVnd: 150_000,
        status: "rejected",
      },
      {
        userId: user.id,
        packageCode: "PKG_TEST_STD",
        offerCode: "OFFER_1M",
        amountVnd: 150_000,
        status: "rejected",
      },
    ]);

    const event = mockEvent("super_admin", user.uuid);
    const res = await handler(event);

    // BR-USD-06: 1 approved + 2 rejected -> exactly 3 orders returned
    expect(res.payments.length).toBe(3);
    const approvedCount = res.payments.filter(
      (p: any) => p.status === "approved"
    ).length;
    const rejectedCount = res.payments.filter(
      (p: any) => p.status === "rejected"
    ).length;
    expect(approvedCount).toBe(1);
    expect(rejectedCount).toBe(2);
  });

  it("D-JD & BR-USD-05: records audit log synchronously on opening user detail with child profiles, and 0 audit logs for user without children", async () => {
    const db = getOwnerDb();

    // 1. User with child profiles
    const [userWithChildren] = await db
      .insert(users)
      .values({
        email: `audit_user_with_kids_${Date.now()}@example.com`,
        displayName: "Audit Parent With Kids",
        status: "active",
      })
      .returning();

    await db.insert(childProfiles).values({
      userId: userWithChildren.id,
      displayName: "Bé Bắp",
      birthYear: 2020,
      avatarId: "avatar-preset-02",
      status: "active",
    });

    // Open detail twice
    const event1 = mockEvent("super_admin", userWithChildren.uuid);
    await handler(event1);
    const event2 = mockEvent("super_admin", userWithChildren.uuid);
    await handler(event2);

    // Verify exactly 2 audit logs recorded (D-JD)
    const logsWithKids = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, userWithChildren.uuid),
          eq(auditLogs.action, "manager.child_profiles.viewed")
        )
      );
    expect(logsWithKids.length).toBe(2);

    // 2. User without child profiles
    const [userNoChildren] = await db
      .insert(users)
      .values({
        email: `audit_user_no_kids_${Date.now()}@example.com`,
        displayName: "Audit Parent No Kids",
        status: "active",
      })
      .returning();

    const eventNoKids = mockEvent("super_admin", userNoChildren.uuid);
    await handler(eventNoKids);

    // Verify 0 audit logs recorded for child viewing (D-JD)
    const logsNoKids = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityId, userNoChildren.uuid),
          eq(auditLogs.action, "manager.child_profiles.viewed")
        )
      );
    expect(logsNoKids.length).toBe(0);
  });
});
