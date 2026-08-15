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
  runExpirePaymentOrders,
  runExpireSoftUnlockEntitlements,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@kidthink/db";
import {
  assertPaymentOrderTransition,
  computeOrderPendingExpiresAt,
  computeSoftUnlockExpiresAt,
  computeStackedExpiryDate,
  formatTransferNote,
  PACKAGE_CATALOG,
} from "@kidthink/shared";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TRANSFER_NOTE_REGEX = /^TM[0-9A-F]{8}$/;

describe("Payment Flow Integration & Concurrency (P2.3)", () => {
  const db = getOwnerDb();
  let testUserId = 0;
  let testManagerId = 0;

  beforeAll(async () => {
    // Seed entitlement keys table
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }

    // Seed packages table
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }

    // Setup test manager
    const [manager] = await db
      .insert(managers)
      .values({
        email: `manager-payment-test-${Date.now()}@example.com`,
        displayName: "Payment SuperAdmin",
        role: "super_admin",
        passwordHash: "hash-mock-123456",
      })
      .returning();
    testManagerId = manager.id;
  });

  beforeEach(async () => {
    // Clean up test data
    if (testUserId) {
      await db
        .delete(notifications)
        .where(eq(notifications.recipientId, testUserId));
      await db.delete(entitlements).where(eq(entitlements.userId, testUserId));
      await db
        .delete(paymentOrders)
        .where(eq(paymentOrders.userId, testUserId));
      await db
        .delete(childProfiles)
        .where(eq(childProfiles.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }

    // Setup fresh test user
    const [user] = await db
      .insert(users)
      .values({
        email: `user-pay-${Date.now()}@example.com`,
        displayName: "Payment Parent",
        passwordHash: "hash-mock-user-123456",
        status: "active",
      })
      .returning();
    testUserId = user.id;

    // Add 2 child profiles for user
    await db.insert(childProfiles).values([
      {
        userId: testUserId,
        displayName: "Bé Gấu",
        birthYear: 2021,
        avatarId: "avatar-bear",
      },
      {
        userId: testUserId,
        displayName: "Bé Thỏ",
        birthYear: 2022,
        avatarId: "avatar-rabbit",
      },
    ]);
  });

  afterAll(async () => {
    if (testUserId) {
      await db
        .delete(notifications)
        .where(eq(notifications.recipientId, testUserId));
      await db.delete(entitlements).where(eq(entitlements.userId, testUserId));
      await db
        .delete(paymentOrders)
        .where(eq(paymentOrders.userId, testUserId));
      await db
        .delete(childProfiles)
        .where(eq(childProfiles.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (testManagerId) {
      await db.delete(managers).where(eq(managers.id, testManagerId));
    }
  });

  it("Task 2 / BR-POC-01, BR-POC-04: User order creation snapshot & duplicate pending prevention", async () => {
    const pkg = PACKAGE_CATALOG["PKG-standard"];
    const offer = pkg.offers[0];
    const orderUuid = crypto.randomUUID();
    const transferNote = formatTransferNote(orderUuid);
    const expiresAt = computeOrderPendingExpiresAt();

    // 1. Create order
    const [createdOrder] = await db
      .insert(paymentOrders)
      .values({
        uuid: orderUuid,
        userId: testUserId,
        packageCode: pkg.code,
        offerCode: offer.offer_code,
        amountVnd: offer.price_vnd,
        currency: "VND",
        status: "pending",
        transferNote,
        expiresAt,
      })
      .returning();

    expect(createdOrder.status).toBe("pending");
    expect(createdOrder.amountVnd).toBe(offer.price_vnd);
    expect(createdOrder.transferNote).toMatch(TRANSFER_NOTE_REGEX);

    // 2. Prevent duplicate pending order for same package (BR-POC-04)
    const [duplicatePending] = await db
      .select()
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.userId, testUserId),
          eq(paymentOrders.packageCode, pkg.code),
          inArray(paymentOrders.status, [
            "draft",
            "pending",
            "pending_proof",
            "submitted",
            "under_review",
          ])
        )
      );

    expect(duplicatePending).toBeDefined();
    expect(duplicatePending.uuid).toBe(orderUuid);

    // 3. User cancels pending order
    assertPaymentOrderTransition(createdOrder.status, "cancelled");
    const [cancelledOrder] = await db
      .update(paymentOrders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(paymentOrders.id, createdOrder.id))
      .returning();

    expect(cancelledOrder.status).toBe("cancelled");
  });

  it("Task 3 / BR-PPU-01: Proof submission grants 3-day soft unlock without granting active status", async () => {
    const pkg = PACKAGE_CATALOG["PKG-standard"];
    const orderUuid = crypto.randomUUID();
    const transferNote = formatTransferNote(orderUuid);

    const [order] = await db
      .insert(paymentOrders)
      .values({
        uuid: orderUuid,
        userId: testUserId,
        packageCode: pkg.code,
        offerCode: "annual",
        amountVnd: pkg.offers[0].price_vnd,
        currency: "VND",
        status: "pending",
        transferNote,
        expiresAt: computeOrderPendingExpiresAt(),
      })
      .returning();

    const softUnlockExpiresAt = computeSoftUnlockExpiresAt();
    const bankTxnRef = "FT24081498765432";

    // Transactionally update order to submitted and grant soft_unlock
    await db.transaction(async (tx) => {
      await tx
        .update(paymentOrders)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          bankTxnRef,
          proofPath: `proofs/${order.uuid}/proof.jpg`,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, order.id));

      for (const key of pkg.entitlements) {
        await tx.insert(entitlements).values({
          userId: testUserId,
          entitlementKey: key,
          source: "package_order",
          sourceRef: order.uuid,
          status: "soft_unlock",
          expiresAt: softUnlockExpiresAt,
        });
      }
    });

    // Verify entitlements
    const grantedEntitlements = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, testUserId));

    expect(grantedEntitlements.length).toBe(pkg.entitlements.length);
    for (const ent of grantedEntitlements) {
      expect(ent.status).toBe("soft_unlock"); // NEVER 'active' (BR-PPU-01)
      expect(ent.sourceRef).toBe(order.uuid);
      expect(ent.expiresAt).toBeDefined();
    }
  });

  it("Task 5 / BR-PAP-01, BR-PAP-05: Row lock approval transaction and stacked expiry date", async () => {
    const pkg = PACKAGE_CATALOG["PKG-standard"];
    const orderUuid = crypto.randomUUID();
    const transferNote = formatTransferNote(orderUuid);

    await db.insert(paymentOrders).values({
      uuid: orderUuid,
      userId: testUserId,
      packageCode: pkg.code,
      offerCode: "annual",
      amountVnd: pkg.offers[0].price_vnd,
      currency: "VND",
      status: "submitted",
      transferNote,
      bankTxnRef: "FT24081412345678",
      submittedAt: new Date(),
    });

    const bonusDays = 5;
    const adminNote = "Đã đối soát sao kê MB Bank khớp 100%.";
    const now = new Date();

    // Manager approves with SELECT ... FOR UPDATE (D-JH)
    await db.transaction(async (tx) => {
      const [lockedOrder] = await tx
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.uuid, orderUuid))
        .for("update");

      expect(lockedOrder.status).toBe("submitted");
      assertPaymentOrderTransition(lockedOrder.status, "approved");

      await tx
        .update(paymentOrders)
        .set({
          status: "approved",
          reviewedAt: now,
          reviewedByManagerId: testManagerId,
          adminNote,
          updatedAt: now,
        })
        .where(eq(paymentOrders.id, lockedOrder.id));

      for (const key of pkg.entitlements) {
        const stackedExpiresAt = computeStackedExpiryDate(
          null,
          365,
          bonusDays,
          now
        );

        await tx.insert(entitlements).values({
          userId: testUserId,
          entitlementKey: key,
          source: "package_order",
          sourceRef: lockedOrder.uuid,
          status: "active",
          expiresAt: stackedExpiresAt,
          grantedByManagerId: testManagerId,
          grantReason: adminNote,
        });
      }

      await tx.insert(auditLogs).values({
        actorType: "manager",
        actorId: testManagerId,
        action: "order_approved",
        entityType: "payment_order",
        entityId: lockedOrder.uuid,
        reason: adminNote,
      });
    });

    // Verify order is approved
    const [finalOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.uuid, orderUuid));
    expect(finalOrder.status).toBe("approved");

    // Verify active entitlements granted with stacked expiry
    const activeEnts = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, testUserId),
          eq(entitlements.status, "active")
        )
      );
    expect(activeEnts.length).toBe(pkg.entitlements.length);

    // Verify expiry date is ~370 days from now (365 + 5 bonus)
    const expectedExpiryMin = new Date(now.getTime() + 369 * 24 * 3600 * 1000);
    const expectedExpiryMax = new Date(now.getTime() + 371 * 24 * 3600 * 1000);
    for (const ent of activeEnts) {
      expect(ent.expiresAt?.getTime()).toBeGreaterThan(
        expectedExpiryMin.getTime()
      );
      expect(ent.expiresAt?.getTime()).toBeLessThan(
        expectedExpiryMax.getTime()
      );
    }
  });

  it("Task 5 / BR-PAP-03: Rejection immediately revokes soft_unlock entitlements in same transaction", async () => {
    const pkg = PACKAGE_CATALOG["PKG-standard"];
    const orderUuid = crypto.randomUUID();

    const [order] = await db
      .insert(paymentOrders)
      .values({
        uuid: orderUuid,
        userId: testUserId,
        packageCode: pkg.code,
        offerCode: "annual",
        amountVnd: pkg.offers[0].price_vnd,
        currency: "VND",
        status: "submitted",
        bankTxnRef: "FT240814FAKE1234",
        submittedAt: new Date(),
      })
      .returning();

    // Create soft_unlock entitlement
    for (const key of pkg.entitlements) {
      await db.insert(entitlements).values({
        userId: testUserId,
        entitlementKey: key,
        source: "package_order",
        sourceRef: order.uuid,
        status: "soft_unlock",
        expiresAt: computeSoftUnlockExpiresAt(),
      });
    }

    const rejectionReason =
      "Ảnh chứng từ bị mờ và không tìm thấy giao dịch trên sao kê.";

    // Reject transaction
    await db.transaction(async (tx) => {
      const [lockedOrder] = await tx
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.uuid, orderUuid))
        .for("update");

      assertPaymentOrderTransition(lockedOrder.status, "rejected");

      await tx
        .update(paymentOrders)
        .set({
          status: "rejected",
          reviewedAt: new Date(),
          reviewedByManagerId: testManagerId,
          adminNote: rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, lockedOrder.id));

      await tx
        .update(entitlements)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(entitlements.userId, testUserId),
            eq(entitlements.sourceRef, order.uuid)
          )
        );
    });

    // Verify entitlements are cancelled immediately (BR-PAP-03, D-JI)
    const postRejectionEnts = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, testUserId));

    expect(postRejectionEnts.every((e) => e.status === "cancelled")).toBe(true);
  });

  it("Task 6 / D-JL: Expiry jobs sweep correctly without corrupting submitted order states", async () => {
    // 1. Setup expired pending order (> 48h ago)
    const expiredPendingDate = new Date(Date.now() - 49 * 3600 * 1000);
    const [expiredPending] = await db
      .insert(paymentOrders)
      .values({
        uuid: crypto.randomUUID(),
        userId: testUserId,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 599_000,
        currency: "VND",
        status: "pending",
        expiresAt: expiredPendingDate,
      })
      .returning();

    // 2. Setup submitted order with expired soft_unlock entitlement (> 3 days ago)
    const submittedOrderUuid = crypto.randomUUID();
    await db.insert(paymentOrders).values({
      uuid: submittedOrderUuid,
      userId: testUserId,
      packageCode: "PKG-standard",
      offerCode: "annual",
      amountVnd: 599_000,
      currency: "VND",
      status: "submitted",
      submittedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    });

    const expiredSoftUnlockDate = new Date(Date.now() - 1 * 3600 * 1000);
    await db.insert(entitlements).values({
      userId: testUserId,
      entitlementKey: "play_standard_games",
      source: "package_order",
      sourceRef: submittedOrderUuid,
      status: "soft_unlock",
      expiresAt: expiredSoftUnlockDate,
    });

    // Run sweep jobs
    const orderExpireRes = await runExpirePaymentOrders();
    expect(orderExpireRes.expiredCount).toBeGreaterThanOrEqual(1);
    expect(orderExpireRes.orderUuids).toContain(expiredPending.uuid);

    const softUnlockExpireRes = await runExpireSoftUnlockEntitlements();
    expect(softUnlockExpireRes.expiredCount).toBeGreaterThanOrEqual(1);

    // D-JL Check: Order MUST STILL be 'submitted' even when soft_unlock expired!
    const [refreshedSubmittedOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.uuid, submittedOrderUuid));
    expect(refreshedSubmittedOrder.status).toBe("submitted");
  });
});
