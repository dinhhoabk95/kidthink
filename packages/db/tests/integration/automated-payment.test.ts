import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  auditLogs,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  packages,
  paymentOrders,
  paymentTransactions,
  processAutomatedPaymentWebhook,
  reconcileAutomatedPayments,
  recurringSubscriptions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "../../src/index.js";

const RE_REPLAY_DETECTED = /quá thời gian|WEBHOOK_REPLAY_DETECTED/;
const RE_RECONCILIATION_MISMATCH = /không khớp|RECONCILIATION_MISMATCH/;

describe("Automated Payment Integration Tests (P5.1 / Task #71)", () => {
  beforeEach(async () => {
    // Clear test tables
    const db = getOwnerDb();
    await db.delete(paymentTransactions);
    await db.delete(entitlements);
    await db.delete(paymentOrders);
    await db.delete(recurringSubscriptions);

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

  it("Scenario: BR-APM-01..05 — processes valid webhook, updates order, grants entitlements atomically, writes audit log", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_user_${Date.now()}@example.com`,
        displayName: "Auto Pay User",
      })
      .returning();

    const [order] = await db
      .insert(paymentOrders)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 299_000,
        status: "pending",
      })
      .returning();

    const now = new Date();
    const timestampSeconds = Math.floor(now.getTime() / 1000);

    const payload = {
      provider: "payos" as const,
      provider_event_id: `evt_payos_${Date.now()}`,
      order_uuid: order.uuid,
      amount_vnd: 299_000,
      status: "success" as const,
      timestamp_seconds: timestampSeconds,
      merchant_id: "merchant_test_123",
      raw_data: { test: true },
    };

    const result = await processAutomatedPaymentWebhook(payload, now);

    expect(result.success).toBe(true);
    expect(result.orderStatus).toBe("approved");
    expect(result.isDuplicate).toBe(false);

    // Verify order is approved
    const [updatedOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, order.id));
    expect(updatedOrder.status).toBe("approved");

    // Verify payment_transactions ledger record
    const [txRecord] = await db
      .select()
      .from(paymentTransactions)
      .where(
        eq(paymentTransactions.providerEventId, payload.provider_event_id)
      );
    expect(txRecord).toBeDefined();
    expect(txRecord.amountVnd).toBe(299_000);
    expect(txRecord.status).toBe("success");

    // Verify entitlements granted
    const userEntitlements = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(userEntitlements.length).toBeGreaterThanOrEqual(1);
    expect(userEntitlements[0].status).toBe("active");

    // Verify audit log
    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "payment_order"),
          eq(auditLogs.entityId, String(order.id))
        )
      );
    expect(audit).toBeDefined();
    expect(audit.action).toBe("payment_order.approved_webhook");
  });

  it("Scenario: BR-APM-03 — enforces idempotency on duplicate webhook delivery", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_dup_${Date.now()}@example.com`,
        displayName: "Dup Pay User",
      })
      .returning();

    const [order] = await db
      .insert(paymentOrders)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 299_000,
        status: "pending",
      })
      .returning();

    const now = new Date();
    const timestampSeconds = Math.floor(now.getTime() / 1000);

    const payload = {
      provider: "payos" as const,
      provider_event_id: `evt_dup_${Date.now()}`,
      order_uuid: order.uuid,
      amount_vnd: 299_000,
      status: "success" as const,
      timestamp_seconds: timestampSeconds,
      merchant_id: "merchant_test_123",
    };

    // First delivery
    const res1 = await processAutomatedPaymentWebhook(payload, now);
    expect(res1.isDuplicate).toBe(false);

    // Second delivery (duplicate)
    const res2 = await processAutomatedPaymentWebhook(payload, now);
    expect(res2.isDuplicate).toBe(true);

    // Entitlements should have exactly 5 active records for PKG-standard (not doubled to 10)
    const userEntitlements = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(userEntitlements).toHaveLength(5);
    for (const e of userEntitlements) {
      expect(e.status).toBe("active");
    }
  });

  it("Scenario: BR-APM-02 — rejects webhook outside replay window (300s)", async () => {
    const now = new Date();
    const oldTimestampSeconds = Math.floor(now.getTime() / 1000) - 500; // 500s ago

    const payload = {
      provider: "vnpay" as const,
      provider_event_id: `evt_old_${Date.now()}`,
      order_uuid: "00000000-0000-0000-0000-000000000001",
      amount_vnd: 299_000,
      status: "success" as const,
      timestamp_seconds: oldTimestampSeconds,
      merchant_id: "merchant_test_123",
    };

    await expect(
      processAutomatedPaymentWebhook(payload, now)
    ).rejects.toThrowError(RE_REPLAY_DETECTED);
  });

  it("Scenario: BR-APM-06 — detects amount mismatch and records mismatch transaction", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_mismatch_${Date.now()}@example.com`,
        displayName: "Mismatch Pay User",
      })
      .returning();

    const [order] = await db
      .insert(paymentOrders)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 299_000,
        status: "pending",
      })
      .returning();

    const now = new Date();
    const timestampSeconds = Math.floor(now.getTime() / 1000);

    const payload = {
      provider: "payos" as const,
      provider_event_id: `evt_mismatch_${Date.now()}`,
      order_uuid: order.uuid,
      amount_vnd: 199_000, // mismatch
      status: "success" as const,
      timestamp_seconds: timestampSeconds,
      merchant_id: "merchant_test_123",
    };

    await expect(
      processAutomatedPaymentWebhook(payload, now)
    ).rejects.toThrowError(RE_RECONCILIATION_MISMATCH);

    // Order should NOT be approved
    const [unchangedOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, order.id));
    expect(unchangedOrder.status).toBe("pending");
  });

  it("Scenario: BR-APM-06 — reconciliation service reports matched and mismatched records correctly", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `rec_user_${Date.now()}@example.com`,
        displayName: "Rec User",
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

    const eventId = `evt_rec_${Date.now()}`;

    await db.insert(paymentTransactions).values({
      provider: "payos",
      providerEventId: eventId,
      orderUuid: order.uuid,
      amountVnd: 299_000,
      status: "success",
    });

    const report = await reconcileAutomatedPayments({
      provider: "payos",
      records: [
        {
          providerEventId: eventId,
          orderUuid: order.uuid,
          amountVnd: 299_000,
          status: "PAID",
          timestamp: new Date(),
        },
        {
          providerEventId: "evt_missing_in_db",
          orderUuid: "00000000-0000-0000-0000-000000000002",
          amountVnd: 100_000,
          status: "PAID",
          timestamp: new Date(),
        },
      ],
    });

    expect(report.totalChecked).toBe(2);
    expect(report.matchedCount).toBe(1);
    expect(report.mismatchedCount).toBe(1);
    expect(report.mismatches[0].reason).toContain(
      "TRANSACTION_MISSING_IN_INTERNAL_LEDGER"
    );
  });
});
