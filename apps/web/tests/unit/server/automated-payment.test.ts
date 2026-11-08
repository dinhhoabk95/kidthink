import crypto from "node:crypto";
import {
  auditLogs,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  packages,
  paymentOrders,
  paymentTransactions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  processAutomatedPaymentWebhook,
  reconcileAutomatedPayments,
} from "#server/services/automated-payment";

describe("Automated Payment Integration Tests (P5.1 / Task #71)", () => {
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

  it("Scenario: BR-APM-01..05 — processes valid webhook, updates order, grants entitlements atomically, writes audit log", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_user_${crypto.randomUUID()}@example.com`,
        displayName: "Auto Pay User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

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
    if (!order) {
      throw new Error("Failed to insert order");
    }

    const now = new Date();
    const timestampSeconds = Math.floor(now.getTime() / 1000);

    const payload = {
      provider: "payos" as const,
      provider_event_id: `evt_payos_${crypto.randomUUID()}`,
      order_uuid: order.uuid,
      amount_vnd: 299_000,
      status: "success" as const,
      timestamp_seconds: timestampSeconds,
      merchant_id: "merchant_test_123",
      mode: "sandbox",
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
    expect(updatedOrder?.status).toBe("approved");

    // Verify payment_transactions ledger record
    const [txRecord] = await db
      .select()
      .from(paymentTransactions)
      .where(
        eq(paymentTransactions.providerEventId, payload.provider_event_id)
      );
    expect(txRecord).toBeDefined();
    expect(txRecord?.amountVnd).toBe(299_000);
    expect(txRecord?.status).toBe("success");

    // Verify entitlements granted
    const userEntitlements = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(userEntitlements.length).toBeGreaterThanOrEqual(1);
    expect(userEntitlements[0]?.status).toBe("active");

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
    expect(audit?.action).toBe("payment_order.approved_webhook");
  });

  it("Scenario: BR-APM-03 — enforces idempotency on duplicate webhook delivery", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_dup_${crypto.randomUUID()}@example.com`,
        displayName: "Dup Pay User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

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
    if (!order) {
      throw new Error("Failed to insert order");
    }

    const now = new Date();
    const timestampSeconds = Math.floor(now.getTime() / 1000);

    const payload = {
      provider: "payos" as const,
      provider_event_id: `evt_dup_${crypto.randomUUID()}`,
      order_uuid: order.uuid,
      amount_vnd: 299_000,
      status: "success" as const,
      timestamp_seconds: timestampSeconds,
      merchant_id: "merchant_test_123",
      mode: "sandbox",
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
      provider_event_id: `evt_old_${crypto.randomUUID()}`,
      order_uuid: "00000000-0000-0000-0000-000000000001",
      amount_vnd: 299_000,
      status: "success" as const,
      timestamp_seconds: oldTimestampSeconds,
      merchant_id: "merchant_test_123",
      mode: "sandbox",
    };

    await expect(
      processAutomatedPaymentWebhook(payload, now)
    ).rejects.toMatchObject({ code: "WEBHOOK_REPLAY_DETECTED" });
  });

  it("Scenario: BR-APM-06 — detects amount mismatch and records mismatch transaction", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_mismatch_${crypto.randomUUID()}@example.com`,
        displayName: "Mismatch Pay User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

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
    if (!order) {
      throw new Error("Failed to insert order");
    }

    const now = new Date();
    const timestampSeconds = Math.floor(now.getTime() / 1000);

    const payload = {
      provider: "payos" as const,
      provider_event_id: `evt_mismatch_${crypto.randomUUID()}`,
      order_uuid: order.uuid,
      amount_vnd: 199_000, // mismatch
      status: "success" as const,
      timestamp_seconds: timestampSeconds,
      merchant_id: "merchant_test_123",
      mode: "sandbox",
    };

    await expect(
      processAutomatedPaymentWebhook(payload, now)
    ).rejects.toMatchObject({ code: "RECONCILIATION_MISMATCH" });

    // BR-APM-08: order is not approved, it is held for review
    const [heldOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, order.id));
    expect(heldOrder?.status).toBe("under_review");

    const [mismatchTx] = await db
      .select()
      .from(paymentTransactions)
      .where(
        eq(paymentTransactions.providerEventId, payload.provider_event_id)
      );
    expect(mismatchTx?.status).toBe("mismatch");
    expect(mismatchTx?.amountVnd).toBe(199_000);

    const grants = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(grants).toHaveLength(0);

    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "payment_order"),
          eq(auditLogs.entityId, String(order.id))
        )
      );
    expect(audit?.action).toBe("payment_order.mismatch_flagged");

    // Redelivery of the same event is idempotent: 200, no second record
    const again = await processAutomatedPaymentWebhook(payload, now);
    expect(again.isDuplicate).toBe(true);
    expect(again.orderStatus).toBe("under_review");
    const txRows = await db
      .select()
      .from(paymentTransactions)
      .where(
        eq(paymentTransactions.providerEventId, payload.provider_event_id)
      );
    expect(txRows).toHaveLength(1);
  });

  it("Scenario: BR-APM-08 — mismatch on an already approved order records it without changing status", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_mm_term_${crypto.randomUUID()}@example.com`,
        displayName: "Mismatch Terminal User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
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
    if (!order) {
      throw new Error("Failed to insert order");
    }
    const now = new Date();
    await expect(
      processAutomatedPaymentWebhook(
        {
          provider: "payos" as const,
          provider_event_id: `evt_mm_term_${crypto.randomUUID()}`,
          order_uuid: order.uuid,
          amount_vnd: 1000,
          status: "success" as const,
          timestamp_seconds: Math.floor(now.getTime() / 1000),
          merchant_id: "merchant_test_123",
          mode: "sandbox",
        },
        now
      )
    ).rejects.toMatchObject({ code: "RECONCILIATION_MISMATCH" });
    const [after] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, order.id));
    expect(after?.status).toBe("approved");
  });

  it("Scenario: BR-APM-08 — pending_proof order is approved by a verified webhook", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_pp_${crypto.randomUUID()}@example.com`,
        displayName: "Pending Proof User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
    const [order] = await db
      .insert(paymentOrders)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 299_000,
        status: "pending_proof",
      })
      .returning();
    if (!order) {
      throw new Error("Failed to insert order");
    }
    const now = new Date();
    const result = await processAutomatedPaymentWebhook(
      {
        provider: "payos" as const,
        provider_event_id: `evt_pp_${crypto.randomUUID()}`,
        order_uuid: order.uuid,
        amount_vnd: 299_000,
        status: "success" as const,
        timestamp_seconds: Math.floor(now.getTime() / 1000),
        merchant_id: "merchant_test_123",
        mode: "sandbox",
      },
      now
    );
    expect(result.orderStatus).toBe("approved");
  });

  it("Scenario: BR-APM-06 — reconciliation service reports matched and mismatched records correctly", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `rec_user_${crypto.randomUUID()}@example.com`,
        displayName: "Rec User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

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
    if (!order) {
      throw new Error("Failed to insert order");
    }

    const eventId = `evt_rec_${crypto.randomUUID()}`;

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
    expect(report.mismatches[0]?.reason).toContain(
      "TRANSACTION_MISSING_IN_INTERNAL_LEDGER"
    );
  });

  it("Scenario: BR-APM-02 — two distinct success events racing on one order approve and grant exactly once", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_race_${crypto.randomUUID()}@example.com`,
        displayName: "Race User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
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
    if (!order) {
      throw new Error("Failed to insert order");
    }
    const now = new Date();
    const base = {
      provider: "payos" as const,
      order_uuid: order.uuid,
      amount_vnd: 299_000,
      status: "success" as const,
      timestamp_seconds: Math.floor(now.getTime() / 1000),
      merchant_id: "merchant_test_123",
      mode: "sandbox",
    };
    const results = await Promise.all([
      processAutomatedPaymentWebhook(
        { ...base, provider_event_id: `evt_race_a_${crypto.randomUUID()}` },
        now
      ),
      processAutomatedPaymentWebhook(
        { ...base, provider_event_id: `evt_race_b_${crypto.randomUUID()}` },
        now
      ),
    ]);
    expect(results.map((r) => r.orderStatus)).toEqual(["approved", "approved"]);

    const approvals = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, "payment_order.approved_webhook"),
          eq(auditLogs.entityId, String(order.id))
        )
      );
    expect(approvals).toHaveLength(1);

    const grants = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    const yearMs = 365 * 24 * 60 * 60 * 1000;
    for (const grant of grants) {
      // Không cộng dồn hai lần thời hạn gói.
      expect(grant.expiresAt?.getTime()).toBe(now.getTime() + yearMs);
    }
  });

  it("Scenario: BR-APM-08 — a failed webhook with a different amount is not a mismatch (no money collected)", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `auto_pay_failed_mm_${crypto.randomUUID()}@example.com`,
        displayName: "Failed Mismatch User",
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
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
    if (!order) {
      throw new Error("Failed to insert order");
    }
    const now = new Date();
    const eventId = `evt_failed_mm_${crypto.randomUUID()}`;
    const result = await processAutomatedPaymentWebhook(
      {
        provider: "payos" as const,
        provider_event_id: eventId,
        order_uuid: order.uuid,
        amount_vnd: 1000,
        status: "failed" as const,
        timestamp_seconds: Math.floor(now.getTime() / 1000),
        merchant_id: "merchant_test_123",
        mode: "sandbox",
      },
      now
    );
    expect(result.orderStatus).not.toBe("under_review");
    const [txRow] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerEventId, eventId));
    expect(txRow?.status).toBe("failed");
  });
});
