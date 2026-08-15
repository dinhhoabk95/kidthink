import {
  auditLogs,
  childProfiles,
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
import type { H3Event } from "h3";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import packagesGetHandler from "../../server/api/guest/packages.get.ts";
import managerApproveHandler from "../../server/api/managers/orders/[uuid]/approve.post.ts";
import managerProofUrlHandler from "../../server/api/managers/orders/[uuid]/proof-url.get.ts";
import managerRejectHandler from "../../server/api/managers/orders/[uuid]/reject.post.ts";
import managerOrdersListHandler from "../../server/api/managers/orders/index.get.ts";
import userOrderCancelHandler from "../../server/api/users/orders/[uuid]/cancel.post.ts";
import userOrderGetHandler from "../../server/api/users/orders/[uuid]/index.get.ts";
import userOrderCreateHandler from "../../server/api/users/orders/index.post.ts";

const TRANSFER_NOTE_REGEX = /^TM[0-9A-F]{8}$/;

describe("Payment Flow Full E2E & Boundary Tests (P2.3)", () => {
  const db = getOwnerDb();
  let testUser: { id: number; email: string };
  let testManager: { id: number; email: string };

  const validCsrf =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  function mockUserEvent(
    method: string,
    body?: any,
    params: Record<string, string> = {},
    query: Record<string, any> = {}
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
    } as unknown as H3Event;
  }

  function mockManagerEvent(
    role: "super_admin" | "content_reviewer",
    method: string,
    body?: any,
    params: Record<string, string> = {},
    query: Record<string, any> = {}
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
          refresh_token_version: 1,
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
    } as unknown as H3Event;
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
        role: "super_admin",
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

    const [user] = await db
      .insert(users)
      .values({
        email: `parent-e2e-${Date.now()}@example.com`,
        displayName: "Payment Parent E2E",
        passwordHash: "hash-user-123456",
        status: "active",
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
    // 1. Create submitted order
    const [order] = await db
      .insert(paymentOrders)
      .values({
        uuid: crypto.randomUUID(),
        userId: testUser.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 599_000,
        currency: "VND",
        status: "submitted",
        transferNote: "TMABC12345",
        bankTxnRef: "FT240814E2E0001",
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
    expect(dbOrder.status).toBe("approved");

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
    // 1. Create order with soft_unlock entitlement
    const orderUuid = crypto.randomUUID();
    await db.insert(paymentOrders).values({
      uuid: orderUuid,
      userId: testUser.id,
      packageCode: "PKG-standard",
      offerCode: "annual",
      amountVnd: 599_000,
      currency: "VND",
      status: "submitted",
      transferNote: "TMREJECT01",
      bankTxnRef: "FT240814REJECT01",
      submittedAt: new Date(),
    });

    await db.insert(entitlements).values({
      userId: testUser.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      sourceRef: orderUuid,
      status: "soft_unlock",
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
});
