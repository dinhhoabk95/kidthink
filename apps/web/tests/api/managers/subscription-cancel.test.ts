import {
  entitlementKeys,
  getOwnerDb,
  packages,
  recurringSubscriptions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { beforeEach, describe, expect, it } from "vitest";
import adminCancelHandler from "#server/api/managers/subscriptions/[id]/cancel.post";
import { createRecurringSubscription } from "#server/services/recurring-billing";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const RE_INVALID_CANCEL_REASON = /INVALID_CANCEL_REASON/;

function mockManagerEvent(
  managerRole?: "super_admin" | "content_reviewer",
  subscriptionId?: number,
  body?: Record<string, string | number | boolean>
): H3Event {
  return {
    method: "POST",
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
        url: `/api/managers/subscriptions/${subscriptionId}/cancel`,
      },
      res: {},
    },
    context: {
      params: { id: String(subscriptionId ?? "") },
      body,
      ...(managerRole
        ? {
            superadmin: {
              manager_id: 1,
              display_name: "Test Admin",
              session_id: "sess_admin_test",
              role: managerRole,
            },
            manager: {
              manager_id: 1,
              display_name: "Test Admin",
              session_id: "sess_admin_test",
              role: managerRole,
            },
          }
        : {}),
    },
    _body: body,
  } as H3Event;
}

describe("POST /api/managers/subscriptions/[id]/cancel (BR-ASC-01..06)", () => {
  beforeEach(async () => {
    const db = getOwnerDb();

    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }

    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
  });

  it("Scenario: rejects unauthenticated request with 401", async () => {
    const event = mockManagerEvent(undefined, 1, {
      reason: "other",
      admin_note: "Ghi chú hợp lệ dài trên hai mươi ký tự.",
    });

    await expect(adminCancelHandler(event)).rejects.toThrowError();
  });

  it("Scenario: rejects content_reviewer with 403 INSUFFICIENT_ROLE", async () => {
    const event = mockManagerEvent("content_reviewer", 1, {
      reason: "other",
      admin_note: "Ghi chú hợp lệ dài trên hai mươi ký tự.",
    });

    await expect(adminCancelHandler(event)).rejects.toMatchObject({
      statusCode: 403,
      code: "INSUFFICIENT_ROLE",
    });
  });

  it("Scenario: rejects admin note shorter than 20 chars with 422 INVALID_CANCEL_REASON", async () => {
    const event = mockManagerEvent("super_admin", 1, {
      reason: "other",
      admin_note: "Ngắn",
    });

    await expect(adminCancelHandler(event)).rejects.toThrowError(
      RE_INVALID_CANCEL_REASON
    );
    await expect(adminCancelHandler(event)).rejects.toMatchObject({
      code: "INVALID_CANCEL_REASON",
      statusCode: 422,
    });
  });

  it("Scenario: rejects reason outside closed list with 422 INVALID_CANCEL_REASON", async () => {
    const event = mockManagerEvent("super_admin", 1, {
      reason: "outside_closed_list",
      admin_note: "Ghi chú hợp lệ dài trên hai mươi ký tự.",
    });

    await expect(adminCancelHandler(event)).rejects.toThrowError(
      RE_INVALID_CANCEL_REASON
    );
    await expect(adminCancelHandler(event)).rejects.toMatchObject({
      code: "INVALID_CANCEL_REASON",
      statusCode: 422,
    });
  });

  it("Scenario: successfully cancels subscription with super_admin session", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `admin_sub_cancel_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Sub Cancel User",
      })
      .returning();

    if (!user) {
      throw new Error("Failed to insert user");
    }

    const sub = await createRecurringSubscription({
      userId: user.id,
      packageCode: "PKG-standard",
      offerCode: "annual",
      billingPeriod: "annual",
      priceVnd: 299_000,
      termsVersion: "v1.0",
    });

    if (!sub) {
      throw new Error("Failed to create subscription");
    }

    const event = mockManagerEvent("super_admin", sub.id, {
      reason: "user_request_messenger",
      admin_note: "Khách hàng gửi yêu cầu huỷ qua Facebook Messenger hỗ trợ.",
      revoke_immediate: false,
    });

    const response = await adminCancelHandler(event);

    expect(response.ok).toBe(true);
    expect(response.status).toBe("cancelled");
    expect(response.auto_renew).toBe(false);
    expect(response.revoke_immediate).toBe(false);

    // Verify DB state
    const [dbSub] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    expect(dbSub?.status).toBe("cancelled");
    expect(dbSub?.cancelReason).toBe("user_request_messenger");
  });
});
