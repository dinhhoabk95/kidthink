import {
  ACTOR_TYPE,
  auditLogs,
  consentLogs,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  packages,
  recurringSubscriptions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { PENDING_PRICE_VND } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import cancelRecurringHandler from "#server/api/users/subscriptions/recurring/cancel.post";
import getRecurringHandler from "#server/api/users/subscriptions/recurring/index.get";
import optInRecurringHandler from "#server/api/users/subscriptions/recurring/opt-in.post";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function mockUserEvent(
  userId?: number,
  body?: Record<string, string | number | boolean>,
  method = "GET"
): H3Event {
  return {
    method,
    node: {
      req: {
        headers: {
          "user-agent": "VitestRecurringTest/1.0",
          "x-forwarded-for": "127.0.0.1",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_u_csrf=${CSRF_TOKEN}`,
        },
        socket: { remoteAddress: "127.0.0.1" },
      },
      res: {},
    },
    context: {
      ...(body ? { body } : {}),
      ...(userId
        ? {
            user: {
              user_id: userId,
              display_name: "Recurring User",
              session_id: "sess_recurring_test",
            },
          }
        : {}),
    },
  } as H3Event;
}

const TEST_RECURRING_VND = 599_000;

describe("Recurring Billing API & Schema Suite (#292 S1 & S2, BR-RBL-01..06)", () => {
  beforeEach(async () => {
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
    await db
      .update(packages)
      .set({
        offers: [
          {
            offer_code: "annual",
            billing_period: "1 năm",
            price_vnd: TEST_RECURRING_VND,
            duration_days: 365,
          },
        ],
      })
      .where(eq(packages.code, "PKG-standard"));
  });

  afterAll(async () => {
    const db = getOwnerDb();
    const stdSeed = SEED_PACKAGES.find((p) => p.code === "PKG-standard");
    if (stdSeed) {
      await db
        .update(packages)
        .set({ offers: stdSeed.offers })
        .where(eq(packages.code, "PKG-standard"));
    }
  });

  it("S1: recurringSubscriptions.autoRenew defaults to false in Drizzle schema (BR-RBL-01)", () => {
    expect(recurringSubscriptions.autoRenew.default).toBe(false);
  });

  it("S2: POST /api/users/subscriptions/recurring/opt-in rejects missing consent with 422 VALIDATION_FAILED (BR-RBL-01)", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `optin_noconsent_${Date.now()}@example.com`,
        displayName: "No Consent User",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const event = mockUserEvent(
      user.id,
      {
        package_code: "PKG-standard",
        billing_period: "annual",
      },
      "POST"
    );

    await expect(optInRecurringHandler(event)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      status: 422,
    });
  });

  it("S2: POST /api/users/subscriptions/recurring/opt-in rejects 403 ENTITLEMENT_REQUIRED when user has no paid entitlement or approved order for package", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `optin_unpaid_${Date.now()}@example.com`,
        displayName: "Unpaid Opt-In User",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await expect(
      optInRecurringHandler(
        mockUserEvent(
          user.id,
          {
            package_code: "PKG-standard",
            billing_period: "annual",
            consent_accepted: true,
            terms_version: "2026-10",
          },
          "POST"
        )
      )
    ).rejects.toMatchObject({
      code: "ENTITLEMENT_REQUIRED",
      statusCode: 403,
    });
  });

  it("S2: POST /api/users/subscriptions/recurring/opt-in rejects 422 VALIDATION_FAILED when package offer has price_vnd = 0", async () => {
    const db = getOwnerDb();
    await db
      .update(packages)
      .set({
        offers: [
          {
            offer_code: "annual",
            billing_period: "1 năm",
            price_vnd: PENDING_PRICE_VND,
            duration_days: 365,
          },
        ],
      })
      .where(eq(packages.code, "PKG-standard"));

    const [user] = await db
      .insert(users)
      .values({
        email: `optin_zeroprice_${Date.now()}@example.com`,
        displayName: "Zero Price Opt-In User",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      status: ENTITLEMENT_STATUS.ACTIVE,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    await expect(
      optInRecurringHandler(
        mockUserEvent(
          user.id,
          {
            package_code: "PKG-standard",
            billing_period: "annual",
            consent_accepted: true,
            terms_version: "2026-10",
          },
          "POST"
        )
      )
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      statusCode: 422,
    });
  });

  it("S2: POST /api/users/subscriptions/recurring/opt-in creates subscription with auto_renew=true and snapshots price & consent, GET returns it, and cancel preserves entitlements until period end (BR-RBL-01/02/03/06)", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `optin_full_${Date.now()}@example.com`,
        displayName: "Opt-In User",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    // 1. GET before opt-in returns 404 SUBSCRIPTION_NOT_FOUND
    await expect(
      getRecurringHandler(mockUserEvent(user.id))
    ).rejects.toMatchObject({
      code: "SUBSCRIPTION_NOT_FOUND",
      status: 404,
    });

    // Seed active paid entitlement for PKG-standard before recurring opt-in
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      status: ENTITLEMENT_STATUS.ACTIVE,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // 2. Opt-in with explicit consent
    const optInRes = await optInRecurringHandler(
      mockUserEvent(
        user.id,
        {
          package_code: "PKG-standard",
          billing_period: "annual",
          consent_accepted: true,
          terms_version: "2026-10",
        },
        "POST"
      )
    );

    expect(optInRes.auto_renew).toBe(true);
    expect(optInRes.package_code).toBe("PKG-standard");
    expect(optInRes.billing_period).toBe("annual");
    expect(optInRes.subscription_id).toBeTruthy();
    expect(optInRes.next_billing_date).toBeTruthy();

    // Verify consent_logs and audit_logs recorded
    const userConsents = await db
      .select()
      .from(consentLogs)
      .where(eq(consentLogs.userId, user.id));
    expect(userConsents.length).toBeGreaterThanOrEqual(1);

    const subAudits = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.actorType, ACTOR_TYPE.USER),
          eq(auditLogs.actorId, user.id),
          eq(auditLogs.action, "subscription.opt_in_recurring")
        )
      );
    expect(subAudits.length).toBe(1);

    // 3. GET returns active recurring subscription
    const getRes = await getRecurringHandler(mockUserEvent(user.id));
    expect(getRes.subscription_id).toBe(optInRes.subscription_id);
    expect(getRes.auto_renew).toBe(true);
    expect(getRes.status).toBe("active");
    expect(getRes.consent_terms_version).toBe("2026-10");

    // 4. Cancel recurring subscription
    const cancelRes = await cancelRecurringHandler(
      mockUserEvent(user.id, { reason: "Tạm ngưng gia hạn" }, "POST")
    );
    expect(cancelRes.auto_renew).toBe(false);
    expect(cancelRes.status).toBe("cancelled");
    expect(cancelRes.active_until).toBe(getRes.current_period_end);

    // Entitlement remains active until current_period_end (BR-RBL-03)
    const [entAfterCancel] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(entAfterCancel?.status).toBe(ENTITLEMENT_STATUS.ACTIVE);

    // 5. Second cancel throws 409 SUBSCRIPTION_ALREADY_CANCELLED
    await expect(
      cancelRecurringHandler(mockUserEvent(user.id, {}, "POST"))
    ).rejects.toMatchObject({
      code: "SUBSCRIPTION_ALREADY_CANCELLED",
      status: 409,
    });
  });
});
