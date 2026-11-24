import {
  auditLogs,
  childProfiles,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  MANAGER_ROLE,
  managers,
  notifications,
  PAYMENT_ORDER_STATUS,
  packages,
  paymentOrders,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { PENDING_PRICE_VND } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import packagesGetHandler from "#server/api/guest/packages.get";
import managerApproveHandler from "#server/api/managers/orders/[uuid]/approve.post";
import managerProofUrlHandler from "#server/api/managers/orders/[uuid]/proof-url.get";
import managerRejectHandler from "#server/api/managers/orders/[uuid]/reject.post";
import managerOrdersListHandler from "#server/api/managers/orders/index.get";
import userOrderCancelHandler from "#server/api/users/orders/[uuid]/cancel.post";
import userOrderGetHandler from "#server/api/users/orders/[uuid]/index.get";
import userOrderCreateHandler from "#server/api/users/orders/index.post";

const TRANSFER_NOTE_REGEX = /^TM[0-9A-F]{8}$/;
const TEST_SELLABLE_VND = 599_000;
const TEST_PREMIUM_ANNUAL_VND = 899_000;
const TEST_PREMIUM_LIFETIME_VND = 1_999_000;

describe("Payment Flow Full E2E & Boundary Tests (P2.3)", () => {
  const db = getOwnerDb();
  let testUser: { id: number; email: string };
  let testManager: { id: number; email: string };

  const validCsrf =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  function mockUserEvent(
    method: string,
    body?: Record<string, string | number | boolean | null | object>,
    params: Record<string, string> = {},
    query: Record<string, string | number | boolean> = {}
  ): H3Event {
    const queryString = Object.entries(query)
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");
    const url = queryString ? `/?${queryString}` : "/";

    return {
      method,
      context: {
        user: {
          user_id: testUser.id,
          display_name: "Test User",
        },
        params,
        body,
      },
      node: {
        req: {
          headers: {
            "x-csrf-token": validCsrf,
            cookie: `tm_u_csrf=${validCsrf}; tm_m_csrf=${validCsrf}`,
          },
          url,
          originalUrl: url,
        },
        res: {
          setHeader: (_name: string, _value: string) => {
            // noop
          },
          getHeader: () => undefined,
        },
      },
      _body: body,
      body,
    } as never;
  }

  function mockManagerEvent(
    role: "super_admin" | "content_reviewer",
    method: string,
    body?: Record<string, string | number | boolean | null | object>,
    params: Record<string, string> = {},
    query: Record<string, string | number | boolean> = {},
    reauthAt: Date | null = new Date()
  ): H3Event {
    const queryString = Object.entries(query)
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");
    const url = queryString ? `/?${queryString}` : "/";

    return {
      method,
      context: {
        manager: {
          manager_id: testManager.id,
          display_name: "Test Manager",
          role,
          session_id: "test-session",
          ...(reauthAt ? { reauth_at: reauthAt } : {}),
        },
        params,
        body,
      },
      node: {
        req: {
          headers: {
            "x-csrf-token": validCsrf,
            cookie: `tm_m_csrf=${validCsrf}; tm_u_csrf=${validCsrf}`,
            "user-agent": "Vitest/PaymentE2E",
          },
          socket: {
            remoteAddress: "127.0.0.1",
          },
          url,
          originalUrl: url,
        },
        res: {
          setHeader: (_name: string, _value: string) => {
            // noop
          },
          getHeader: () => undefined,
        },
      },
      _body: body,
      body,
    } as never;
  }

  beforeAll(async () => {
    // Seed entitlement keys
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }

    // Seed packages table
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }

    const [manager] = await db
      .insert(managers)
      .values({
        email: `manager-e2e-${Date.now()}@example.com`,
        displayName: "Payment Super Admin",
        role: MANAGER_ROLE.SUPER_ADMIN,
        passwordHash: "hash-superadmin-123456",
      })
      .returning();
    testManager = manager;
  });

  beforeEach(async () => {
    if (testUser?.id) {
      await db
        .delete(notifications)
        .where(eq(notifications.recipientId, testUser.id));
      await db.delete(entitlements).where(eq(entitlements.userId, testUser.id));
      await db
        .delete(paymentOrders)
        .where(eq(paymentOrders.userId, testUser.id));
      await db
        .delete(childProfiles)
        .where(eq(childProfiles.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }

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
            price_vnd: TEST_SELLABLE_VND,
            duration_days: 365,
          },
        ],
      })
      .where(eq(packages.code, "PKG-standard"));

    await db
      .update(packages)
      .set({
        offers: [
          {
            offer_code: "annual",
            billing_period: "1 năm",
            price_vnd: TEST_PREMIUM_ANNUAL_VND,
            duration_days: 365,
          },
          {
            offer_code: "lifetime",
            billing_period: "trọn đời",
            price_vnd: TEST_PREMIUM_LIFETIME_VND,
            duration_days: null,
          },
        ],
      })
      .where(eq(packages.code, "PKG-premium"));

    const [user] = await db
      .insert(users)
      .values({
        email: `parent-e2e-${Date.now()}@example.com`,
        displayName: "Payment Parent E2E",
        passwordHash: "hash-user-123456",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    testUser = user;

    await db.insert(childProfiles).values({
      userId: testUser.id,
      displayName: "Bé Cún",
      birthYear: 2021,
      avatarId: "avatar-bear",
    });
  });

  afterAll(async () => {
    for (const pkg of SEED_PACKAGES) {
      if (pkg.code === "PKG-standard" || pkg.code === "PKG-premium") {
        await db
          .update(packages)
          .set({ offers: pkg.offers })
          .where(eq(packages.code, pkg.code));
      }
    }
    if (testUser?.id) {
      await db
        .delete(notifications)
        .where(eq(notifications.recipientId, testUser.id));
      await db.delete(entitlements).where(eq(entitlements.userId, testUser.id));
      await db
        .delete(paymentOrders)
        .where(eq(paymentOrders.userId, testUser.id));
      await db
        .delete(childProfiles)
        .where(eq(childProfiles.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }
    if (testManager?.id) {
      await db.delete(managers).where(eq(managers.id, testManager.id));
    }
  });

  it("Guest: GET /api/guest/packages returns catalog without private data", async () => {
    const res = await packagesGetHandler({} as H3Event);
    expect(res.packages).toBeDefined();
    expect(res.packages.length).toBeGreaterThanOrEqual(2);
    const std = res.packages.find((p: any) => p.code === "PKG-standard");
    expect(std).toBeDefined();
    expect(std.offers.length).toBeGreaterThanOrEqual(1);
    expect(std.offers[0].offer_code).toBe("annual");
  });

  it("User Lifecycle: Create order -> Get order -> Cancel order -> Create new order", async () => {
    // 1. Create order
    const createEv = mockUserEvent("POST", {
      package_code: "PKG-standard",
      offer_code: "annual",
      amount_vnd: 1000, // Should be ignored per BR-POC-01
    });
    const created = (await userOrderCreateHandler(createEv)) as any;
    expect(created.uuid).toBeDefined();
    expect(created.amount_vnd).toBe(TEST_SELLABLE_VND);
    expect(created.status).toBe("pending");
    expect(created.transfer_note).toMatch(TRANSFER_NOTE_REGEX);
    expect(created.qr_image_url).toContain("vietqr.io");

    // 2. Query order
    const getEv = mockUserEvent("GET", undefined, { uuid: created.uuid });
    const orderDetail = (await userOrderGetHandler(getEv)) as any;
    expect(orderDetail.uuid).toBe(created.uuid);
    expect(orderDetail.status).toBe("pending");

    // 3. User cancels order
    const cancelEv = mockUserEvent("POST", undefined, { uuid: created.uuid });
    const cancelRes = (await userOrderCancelHandler(cancelEv)) as any;
    expect(cancelRes.status).toBe("cancelled");

    // 4. Create new order after cancellation (succeeds)
    const createEv2 = mockUserEvent("POST", {
      package_code: "PKG-standard",
      offer_code: "annual",
    });
    const created2 = (await userOrderCreateHandler(createEv2)) as any;
    expect(created2.uuid).toBeDefined();
    expect(created2.uuid).not.toBe(created.uuid);
  });

  it("Manager Queue & Approval Flow: List -> Claim -> Proof URL -> Approve with checklist", async () => {
    const randSuffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const [order] = await db
      .insert(paymentOrders)
      .values({
        uuid: crypto.randomUUID(),
        userId: testUser.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 599_000,
        currency: "VND",
        status: PAYMENT_ORDER_STATUS.SUBMITTED,
        transferNote: `TMABC${randSuffix}`,
        bankTxnRef: `FT240814E2E${randSuffix}`,
        proofPath: "proofs/test-proof.jpg",
        submittedAt: new Date(),
      })
      .returning();

    // 2. Manager lists orders (oldest first, no child PII)
    const listEv = mockManagerEvent(
      "super_admin",
      "GET",
      undefined,
      undefined,
      {
        status: "submitted,under_review",
        sort: "oldest",
      }
    );
    const queue = (await managerOrdersListHandler(listEv)) as any;
    expect(queue.items.length).toBeGreaterThanOrEqual(1);
    const queueItem = queue.items.find((i: any) => i.uuid === order.uuid);
    expect(queueItem).toBeDefined();
    expect(queueItem.user.child_profiles_count).toBe(1);
    expect(queueItem.user.children).toBeUndefined(); // BR-PQU-05: NO child PII

    // 3. Manager queries proof URL
    const proofUrlEv = mockManagerEvent("super_admin", "GET", undefined, {
      uuid: order.uuid,
    });
    const proofRes = (await managerProofUrlHandler(proofUrlEv)) as any;
    expect(proofRes.url).toBeDefined();
    expect(proofRes.expires_at).toBeDefined();

    // Check audit log for proof view (D-JK)
    const [proofAudit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "proof_viewed"),
          eq(auditLogs.entityId, order.uuid)
        )
      );
    expect(proofAudit).toBeDefined();

    // 4. Manager approves order
    const approveEv = mockManagerEvent(
      "super_admin",
      "POST",
      {
        admin_note: "Đã đối soát chứng từ khớp hoàn toàn sao kê MB Bank.",
        checklist: {
          amount_matches: true,
          transfer_note_present: true,
          bank_ref_unused: true,
          transfer_time_valid: true,
          proof_legible: true,
        },
        bonus_days: 2,
      },
      { uuid: order.uuid }
    );

    const approveRes = (await managerApproveHandler(approveEv)) as any;
    expect(approveRes.status).toBe("approved");
    expect(approveRes.entitlements.length).toBeGreaterThanOrEqual(1);

    // Verify order is approved in DB
    const [dbOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.uuid, order.uuid));
    expect(dbOrder.status).toBe(PAYMENT_ORDER_STATUS.APPROVED);

    // Verify user received notification
    const [notif] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, testUser.id),
          eq(notifications.templateCode, "order_approved")
        )
      );
    expect(notif).toBeDefined();
  });

  it("Manager Rejection Flow: Rejection revokes soft_unlock and stores audit", async () => {
    const rejSuffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const orderUuid = crypto.randomUUID();
    await db.insert(paymentOrders).values({
      uuid: orderUuid,
      userId: testUser.id,
      packageCode: "PKG-standard",
      offerCode: "annual",
      amountVnd: 599_000,
      currency: "VND",
      status: PAYMENT_ORDER_STATUS.SUBMITTED,
      transferNote: `TMREJECT${rejSuffix}`,
      bankTxnRef: `FT240814REJ${rejSuffix}`,
      submittedAt: new Date(),
    });

    await db.insert(entitlements).values({
      userId: testUser.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      sourceRef: orderUuid,
      status: ENTITLEMENT_STATUS.SOFT_UNLOCK,
      expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    });

    // 2. Manager rejects order
    const rejectEv = mockManagerEvent(
      "super_admin",
      "POST",
      {
        admin_note: "Số tiền chuyển khoản không đủ và biên lai không hợp lệ.",
      },
      { uuid: orderUuid }
    );

    const rejectRes = (await managerRejectHandler(rejectEv)) as any;
    expect(rejectRes.status).toBe("rejected");
    expect(rejectRes.revoked_entitlements).toContain("play_standard_games");

    // 3. User queries rejected order
    const userGetEv = mockUserEvent("GET", undefined, { uuid: orderUuid });
    const userOrderDetail = (await userOrderGetHandler(userGetEv)) as any;
    expect(userOrderDetail.status).toBe("rejected");
    expect(userOrderDetail.rejection_reason).toContain("chưa khớp");
    expect(userOrderDetail.rejection_reason).not.toContain(
      "biên lai không hợp lệ"
    ); // Internal note not leaked
  });

  it("User Lifecycle: rejects order creation with 422 when package offer price_vnd is 0", async () => {
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

    const createEv = mockUserEvent("POST", {
      package_code: "PKG-standard",
      offer_code: "annual",
    });

    await expect(userOrderCreateHandler(createEv)).rejects.toMatchObject({
      statusCode: 422,
      code: "VALIDATION_FAILED",
    });
  });

  it("Manager Approve & Reject: rejects missing or expired reauth_at (> 300s) with 428 REAUTH_REQUIRED", async () => {
    const suffix = Math.floor(Math.random() * 900_000 + 100_000).toString();
    const orderUuid = crypto.randomUUID();
    await db.insert(paymentOrders).values({
      uuid: orderUuid,
      userId: testUser.id,
      packageCode: "PKG-standard",
      offerCode: "annual",
      amountVnd: TEST_SELLABLE_VND,
      currency: "VND",
      status: PAYMENT_ORDER_STATUS.SUBMITTED,
      transferNote: `TMREAUTH${suffix}`,
      bankTxnRef: `FT240814REAUTH${suffix}`,
      proofPath: "proofs/test-reauth.jpg",
      submittedAt: new Date(),
    });

    const approveBody = {
      admin_note: "Đã đối soát chứng từ khớp hoàn toàn sao kê MB Bank.",
      checklist: {
        amount_matches: true,
        transfer_note_present: true,
        bank_ref_unused: true,
        transfer_time_valid: true,
        proof_legible: true,
      },
      bonus_days: 0,
    };

    await expect(
      managerApproveHandler(
        mockManagerEvent(
          "super_admin",
          "POST",
          approveBody,
          { uuid: orderUuid },
          {},
          null
        )
      )
    ).rejects.toMatchObject({
      statusCode: 428,
      code: "REAUTH_REQUIRED",
    });

    await expect(
      managerApproveHandler(
        mockManagerEvent(
          "super_admin",
          "POST",
          approveBody,
          { uuid: orderUuid },
          {},
          new Date(Date.now() - 301 * 1000)
        )
      )
    ).rejects.toMatchObject({
      statusCode: 428,
      code: "REAUTH_REQUIRED",
    });

    const rejectBody = {
      admin_note: "Từ chối đơn hàng do chứng từ không hợp lệ.",
    };

    await expect(
      managerRejectHandler(
        mockManagerEvent(
          "super_admin",
          "POST",
          rejectBody,
          { uuid: orderUuid },
          {},
          null
        )
      )
    ).rejects.toMatchObject({
      statusCode: 428,
      code: "REAUTH_REQUIRED",
    });

    await expect(
      managerRejectHandler(
        mockManagerEvent(
          "super_admin",
          "POST",
          rejectBody,
          { uuid: orderUuid },
          {},
          new Date(Date.now() - 301 * 1000)
        )
      )
    ).rejects.toMatchObject({
      statusCode: 428,
      code: "REAUTH_REQUIRED",
    });

    const [dbOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.uuid, orderUuid));
    expect(dbOrder?.status).toBe(PAYMENT_ORDER_STATUS.SUBMITTED);
  });
});
