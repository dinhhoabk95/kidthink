import {
  createRecurringSubscription,
  entitlementKeys,
  getOwnerDb,
  packages,
  recurringSubscriptions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import adminCancelHandler from "../../../server/api/managers/subscriptions/[id]/cancel.post.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const RE_INVALID_CANCEL_REASON = /VALIDATION_FAILED|Ghi chú huỷ gói/;

function mockManagerEvent(
  managerRole?: "super_admin" | "content_reviewer",
  subscriptionId?: number,
  body?: Record<string, unknown>
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
  } as unknown as Parameters<typeof adminCancelHandler>[0];
}

describe("POST /api/managers/subscriptions/[id]/cancel (BR-ASC-01..06)", () => {
  beforeEach(async () => {
    const db = getOwnerDb();

    await db
      .insert(packages)
      .values(SEED_PACKAGES as unknown as (typeof packages.$inferInsert)[])
      .onConflictDoNothing();

    await db
      .insert(entitlementKeys)
      .values(
        SEED_ENTITLEMENT_KEYS as unknown as (typeof entitlementKeys.$inferInsert)[]
      )
      .onConflictDoNothing();
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

    try {
      await adminCancelHandler(event);
      expect.fail("Should have thrown 403");
    } catch (err: unknown) {
      const errorObj = err as { statusCode?: number; status?: number };
      expect(errorObj.statusCode || errorObj.status).toBe(403);
    }
  });

  it("Scenario: rejects admin note shorter than 20 chars with 422", async () => {
    const event = mockManagerEvent("super_admin", 1, {
      reason: "other",
      admin_note: "Ngắn",
    });

    await expect(adminCancelHandler(event)).rejects.toThrowError(
      RE_INVALID_CANCEL_REASON
    );
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

    const sub = await createRecurringSubscription({
      userId: user.id,
      packageCode: "PKG-standard",
      offerCode: "annual",
      billingPeriod: "annual",
      priceVnd: 299_000,
      termsVersion: "v1.0",
    });

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
    expect(dbSub.status).toBe("cancelled");
    expect(dbSub.cancelReason).toBe("user_request_messenger");
  });
});
