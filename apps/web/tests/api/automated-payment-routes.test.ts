import crypto from "node:crypto";
import {
  auditLogs,
  getOwnerDb,
  paymentOrders,
  paymentTransactions,
  users,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import getReconciliationHandler from "#server/api/managers/payments/reconciliation/index.get";
import runReconciliationHandler from "#server/api/managers/payments/reconciliation/run.post";
import createCheckoutSessionHandler from "#server/api/users/orders/[uuid]/checkout-session.post";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function buildUserEvent(options: {
  method: "POST";
  url: string;
  user: {
    user_id: number;
    display_name: string;
    session_id: string;
  };
  params: Record<string, string>;
  body: Record<string, string | number>;
}): H3Event {
  const req = {
    method: options.method,
    url: options.url,
    headers: {
      host: "mindkid.test",
      "user-agent": "VitestRunner/1.0",
      "x-csrf-token": CSRF_TOKEN,
      cookie: `tm_u_csrf=${CSRF_TOKEN}`,
    },
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    statusCode: 200,
    getHeader: () => undefined,
    setHeader: () => undefined,
  };
  const event = createEvent(req as never, res as never);
  event.context.user = options.user;
  event.context.params = options.params;
  event.context.body = options.body;
  return event;
}

function buildManagerEvent(options: {
  method: "GET" | "POST";
  url: string;
  manager: {
    manager_id: number;
    display_name: string;
    role: "super_admin" | "content_reviewer";
    session_id: string;
  };
  body?: Record<string, unknown>;
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
  event.context.manager = options.manager;
  if (options.body) {
    event.context.body = options.body;
  }
  return event;
}

describe("Automated Payment Routes (Task #305 S4 — BR-APM-03, BR-APM-06)", () => {
  it("POST /api/users/orders/[uuid]/checkout-session enforces server catalog price (BR-APM-03) and blocks cross-user or processed orders", async () => {
    const db = getOwnerDb();

    const [userA] = await db
      .insert(users)
      .values({
        email: `chk_user_a_${crypto.randomUUID()}@example.com`,
        displayName: "Checkout User A",
        status: "active",
      })
      .returning();

    const [userB] = await db
      .insert(users)
      .values({
        email: `chk_user_b_${crypto.randomUUID()}@example.com`,
        displayName: "Checkout User B",
        status: "active",
      })
      .returning();

    const [pendingOrder] = await db
      .insert(paymentOrders)
      .values({
        userId: userA.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 299_000,
        status: "pending",
      })
      .returning();

    const [approvedOrder] = await db
      .insert(paymentOrders)
      .values({
        userId: userA.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 299_000,
        status: "approved",
      })
      .returning();

    // 1. Valid checkout session ignores client amount_vnd and uses PACKAGE_CATALOG price (299_000)
    const validEvent = buildUserEvent({
      method: "POST",
      url: `/api/users/orders/${pendingOrder.uuid}/checkout-session`,
      user: {
        user_id: userA.id,
        display_name: userA.displayName,
        session_id: "sess_u_a",
      },
      params: { uuid: pendingOrder.uuid },
      body: {
        provider: "payos",
        amount_vnd: 1000,
      },
    });

    const sessionRes = await createCheckoutSessionHandler(validEvent);
    expect(sessionRes.order_uuid).toBe(pendingOrder.uuid);
    expect(sessionRes.provider).toBe("payos");
    expect(sessionRes.amount_vnd).toBe(299_000);
    expect(sessionRes.checkout_url).toContain(pendingOrder.uuid);
    expect(sessionRes.qr_payload).toBeTruthy();

    // 2. Negative case: User B attempts to create checkout session for User A's order -> 404 NOT_FOUND
    const crossUserEvent = buildUserEvent({
      method: "POST",
      url: `/api/users/orders/${pendingOrder.uuid}/checkout-session`,
      user: {
        user_id: userB.id,
        display_name: userB.displayName,
        session_id: "sess_u_b",
      },
      params: { uuid: pendingOrder.uuid },
      body: { provider: "payos" },
    });

    await expect(
      createCheckoutSessionHandler(crossUserEvent)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });

    // 3. Negative case: Already approved order -> 409 ORDER_ALREADY_PROCESSED
    const processedEvent = buildUserEvent({
      method: "POST",
      url: `/api/users/orders/${approvedOrder.uuid}/checkout-session`,
      user: {
        user_id: userA.id,
        display_name: userA.displayName,
        session_id: "sess_u_a",
      },
      params: { uuid: approvedOrder.uuid },
      body: { provider: "payos" },
    });

    await expect(
      createCheckoutSessionHandler(processedEvent)
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "ORDER_ALREADY_PROCESSED",
    });
  });

  it("GET & POST /api/managers/payments/reconciliation inspect ledger, reconcile records, write audit log, and enforce super_admin RBAC", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `recon_route_${crypto.randomUUID()}@example.com`,
        displayName: "Recon Route User",
        status: "active",
      })
      .returning();

    const [order] = await db
      .insert(paymentOrders)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 299_000,
        status: "approved",
      })
      .returning();

    const providerEventId = `evt_route_${crypto.randomUUID()}`;
    await db.insert(paymentTransactions).values({
      provider: "payos",
      providerEventId,
      orderId: order.id,
      orderUuid: order.uuid,
      amountVnd: 299_000,
      status: "success",
    });

    // 1. GET reconciliation summary as super_admin
    const getEvent = buildManagerEvent({
      method: "GET",
      url: "/api/managers/payments/reconciliation?provider=payos&limit=20",
      manager: {
        manager_id: 1,
        display_name: "Super Admin",
        role: "super_admin",
        session_id: "sess_mgr_1",
      },
    });

    const getRes = await getReconciliationHandler(getEvent);
    expect(getRes.provider).toBe("payos");
    expect(
      getRes.items.some((i) => i.provider_event_id === providerEventId)
    ).toBe(true);
    expect(getRes.summary.total_checked).toBeGreaterThanOrEqual(1);

    // 2. POST reconciliation run as super_admin -> reconciles & writes audit log
    const missingOrderUuid = crypto.randomUUID();
    const runEvent = buildManagerEvent({
      method: "POST",
      url: "/api/managers/payments/reconciliation/run",
      manager: {
        manager_id: 1,
        display_name: "Super Admin",
        role: "super_admin",
        session_id: "sess_mgr_1",
      },
      body: {
        provider: "payos",
        reason: "Đối soát định kỳ cổng PayOS",
        records: [
          {
            provider_event_id: providerEventId,
            order_uuid: order.uuid,
            amount_vnd: 299_000,
            status: "PAID",
          },
          {
            provider_event_id: `evt_missing_${crypto.randomUUID()}`,
            order_uuid: missingOrderUuid,
            amount_vnd: 199_000,
            status: "PAID",
          },
        ],
      },
    });

    const runRes = await runReconciliationHandler(runEvent);
    expect(runRes.ok).toBe(true);
    expect(runRes.total_checked).toBe(2);
    expect(runRes.matched_count).toBe(1);
    expect(runRes.mismatched_count).toBe(1);

    const [auditRow] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "payment_reconciliation"),
          eq(auditLogs.entityId, "payos"),
          eq(auditLogs.action, "data_exported")
        )
      );
    expect(auditRow).toBeDefined();

    // 3. Negative case: content_reviewer is rejected with 403
    const forbiddenEvent = buildManagerEvent({
      method: "POST",
      url: "/api/managers/payments/reconciliation/run",
      manager: {
        manager_id: 2,
        display_name: "Reviewer",
        role: "content_reviewer",
        session_id: "sess_mgr_2",
      },
      body: {
        provider: "payos",
        records: [],
      },
    });

    await expect(
      runReconciliationHandler(forbiddenEvent)
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
