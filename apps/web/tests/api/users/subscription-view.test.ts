import {
  entitlementKeys,
  entitlements,
  getOwnerDb,
  packages,
  paymentOrders,
  recurringSubscriptions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@mindkid/db";
import { beforeEach, describe, expect, it } from "vitest";
import subscriptionHandler from "#server/api/users/subscription.get";

function mockUserEvent(userId?: number) {
  return {
    method: "GET",
    node: {
      req: {
        headers: {},
      },
      res: {},
    },
    context: {
      ...(userId
        ? {
            user: {
              user_id: userId,
              display_name: "Test User",
              session_id: "sess_user_test",
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 6 — User Subscription View Suite (BR-SBV-01..07, D-JQ)", () => {
  beforeEach(async () => {
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
  });
  it("Scenario: unauthenticated request is rejected with 401", async () => {
    const event = mockUserEvent();
    await expect(subscriptionHandler(event)).rejects.toThrow();
  });

  it("Scenario: BR-SBV-06 — strictly returns subscription and order data belonging only to current user", async () => {
    const db = getOwnerDb();

    // Create 2 separate users
    const [userA] = await db
      .insert(users)
      .values({
        email: `user_a_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "User A",
      })
      .returning();

    const [userB] = await db
      .insert(users)
      .values({
        email: `user_b_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "User B",
      })
      .returning();

    // Order for User B
    await db.insert(paymentOrders).values({
      userId: userB.id,
      packageCode: "PKG-premium",
      offerCode: "annual",
      amountVnd: 490_000,
      status: "approved",
    });

    const eventA = mockUserEvent(userA.id);
    const resA = await subscriptionHandler(eventA);

    expect(resA.packages).toHaveLength(0);
    expect(resA.orders).toHaveLength(0);
  });

  it("Scenario: D-MN — displays all active packages when multi-package subscription exists", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `user_multi_pkg_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Multi Pkg User",
      })
      .returning();

    const futureExpiry = new Date(Date.now() + 60 * 86_400_000);

    // 1. Grant standard package entitlement
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      status: "active",
      expiresAt: futureExpiry,
    });

    // 2. Grant manual add-on entitlement (create_lesson_plan)
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "create_lesson_plan",
      source: "manual_grant",
      status: "active",
      expiresAt: futureExpiry,
      grantReason: "Cấp quyền đối tác nội bộ 60 ngày.",
    });

    const event = mockUserEvent(user.id);
    const res = await subscriptionHandler(event);

    expect(res).toBeDefined();
    expect(res.packages.length).toBeGreaterThanOrEqual(2);

    const keys = res.entitlements.map((e) => e.key);
    expect(keys).toContain("play_standard_games");
    expect(keys).toContain("create_lesson_plan");

    const manualAddon = res.entitlements.find(
      (e) => e.key === "create_lesson_plan"
    );
    expect(manualAddon?.source_label).toBe("Được cấp");
  });

  it("Scenario: BR-SBV-02 — returns data preservation statement on subscription expiry", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `user_preserve_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Preserve User",
      })
      .returning();

    const event = mockUserEvent(user.id);
    const res = await subscriptionHandler(event);

    expect(res.data_preservation_notice).toContain(
      "hồ sơ của các bé và toàn bộ tiến độ học vẫn được giữ nguyên"
    );
  });

  it("Scenario: BR-SBV-03 & BR-SBV-04 — returns all orders and NEVER leaks internal admin notes", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `user_orders_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Orders User",
      })
      .returning();

    // Approved order
    await db.insert(paymentOrders).values({
      userId: user.id,
      packageCode: "PKG-standard",
      offerCode: "annual",
      amountVnd: 299_000,
      status: "approved",
    });

    // Rejected order with internal admin note
    await db.insert(paymentOrders).values({
      userId: user.id,
      packageCode: "PKG-premium",
      offerCode: "annual",
      amountVnd: 490_000,
      status: "rejected",
      adminNote: JSON.stringify({
        internal_fraud_flag: true,
        secret_manager_comment: "Nghi vấn làm giả sao kê ngân hàng VCB.",
      }),
    });

    const event = mockUserEvent(user.id);
    const res = await subscriptionHandler(event);

    // BR-SBV-03: All orders (2) are returned
    expect(res.orders).toHaveLength(2);

    const rejectedOrder = res.orders.find((o) => o.status === "rejected");
    expect(rejectedOrder).toBeDefined();

    // BR-SBV-04: internal admin note is NEVER exposed verbatim!
    expect((rejectedOrder as any).admin_note).toBeUndefined();
    expect((rejectedOrder as any).adminNote).toBeUndefined();
    expect(JSON.stringify(rejectedOrder)).not.toContain(
      "Nghi vấn làm giả sao kê"
    );
    expect(rejectedOrder?.polite_reason).toContain(
      "chưa khớp với giao dịch ngân hàng"
    );
  });

  it("Scenario: BR-SBV-07 — indicates has_higher_tier for upgrade CTA when user does not have premium", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `user_upgrade_cta_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "CTA User",
      })
      .returning();

    const event = mockUserEvent(user.id);
    const res = await subscriptionHandler(event);

    // Free user has higher tier available
    expect(res.has_higher_tier).toBe(true);
  });

  it("Scenario: P5.1 — returns recurring subscription details and cancellation guidance", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `user_recurring_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Recurring Sub User",
      })
      .returning();

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 86_400_000);

    await db.insert(recurringSubscriptions).values({
      userId: user.id,
      packageCode: "PKG-standard",
      offerCode: "monthly",
      billingPeriod: "monthly",
      priceVnd: 49_000,
      autoRenew: true,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingAt: periodEnd,
      consentTermsVersion: "v1.0",
    });

    const event = mockUserEvent(user.id);
    const res = await subscriptionHandler(event);

    expect(res.recurring_subscription).toBeDefined();
    expect(res.recurring_subscription?.auto_renew).toBe(true);
    expect(res.recurring_subscription?.status).toBe("active");
    expect(res.recurring_subscription?.can_cancel).toBe(true);
    expect(res.cancellation_guidance).toContain("Huỷ gia hạn tự động");
  });
});
