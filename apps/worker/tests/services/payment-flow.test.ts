import {
  ACTOR_TYPE,
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
  PAYMENT_ORDER_STATUS_CODEC,
  packages,
  paymentOrders,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  USER_STATUS,
  users,
} from "@mindkid/db";
import {
  assertPaymentOrderTransition,
  computeOrderPendingExpiresAt,
  computeSoftUnlockExpiresAt,
  computeStackedExpiryDate,
  formatTransferNote,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  runExpirePaymentOrders,
  runExpireSoftUnlockEntitlements,
} from "#src/services/payment-jobs";

const TRANSFER_NOTE_REGEX = /^TM[0-9A-F]{8}$/;
const UNIQUE_OPEN_ORDER_REGEX =
  /UNIQUE constraint failed: payment_orders\.user_id, payment_orders\.package_code/;

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
        email: `manager-payment-test-${crypto.randomUUID()}@example.com`,
        displayName: "Payment SuperAdmin",
        role: MANAGER_ROLE.SUPER_ADMIN,
        passwordHash: "hash-mock-123456",
      })
      .returning();
    if (!manager) {
      throw new Error("Failed to insert manager");
    }
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
        email: `user-pay-${crypto.randomUUID()}@example.com`,
        displayName: "Payment Parent",
        passwordHash: "hash-mock-user-123456",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }
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
    if (!pkg?.offers[0]) {
      throw new Error("PKG-standard not found");
    }
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
        status: PAYMENT_ORDER_STATUS.PENDING,
        transferNote,
        expiresAt,
      })
      .returning();
    if (!createdOrder) {
      throw new Error("Failed to insert createdOrder");
    }

    expect(createdOrder.status).toBe(PAYMENT_ORDER_STATUS.PENDING);
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
            PAYMENT_ORDER_STATUS.DRAFT,
            PAYMENT_ORDER_STATUS.PENDING,
            PAYMENT_ORDER_STATUS.PENDING_PROOF,
            PAYMENT_ORDER_STATUS.SUBMITTED,
            PAYMENT_ORDER_STATUS.UNDER_REVIEW,
          ])
        )
      );

    expect(duplicatePending).toBeDefined();
    expect(duplicatePending?.uuid).toBe(orderUuid);

    // 3. User cancels pending order
    assertPaymentOrderTransition(
      PAYMENT_ORDER_STATUS_CODEC.toLabel(createdOrder.status),
      "cancelled"
    );
    const [cancelledOrder] = await db
      .update(paymentOrders)
      .set({ status: PAYMENT_ORDER_STATUS.CANCELLED, updatedAt: new Date() })
      .where(eq(paymentOrders.id, createdOrder.id))
      .returning();

    expect(cancelledOrder?.status).toBe(PAYMENT_ORDER_STATUS.CANCELLED);
  });

  it("Task 3 / BR-PPU-01: Proof submission grants 3-day soft unlock without granting active status", async () => {
    const pkg = PACKAGE_CATALOG["PKG-standard"];
    if (!pkg?.offers[0]) {
      throw new Error("PKG-standard not found");
    }
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
        status: PAYMENT_ORDER_STATUS.PENDING,
        transferNote,
        expiresAt: computeOrderPendingExpiresAt(),
      })
      .returning();
    if (!order) {
      throw new Error("Failed to insert order");
    }

    const softUnlockExpiresAt = computeSoftUnlockExpiresAt();
    const bankTxnRef = "FT24081498765432";

    // Transactionally update order to submitted and grant soft_unlock
    await db.transaction(async (tx) => {
      await tx
        .update(paymentOrders)
        .set({
          status: PAYMENT_ORDER_STATUS.SUBMITTED,
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
          source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
          sourceRef: order.uuid,
          status: ENTITLEMENT_STATUS.SOFT_UNLOCK,
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
      expect(ent.status).toBe(ENTITLEMENT_STATUS.SOFT_UNLOCK); // NEVER 'active' (BR-PPU-01)
      expect(ent.sourceRef).toBe(order.uuid);
      expect(ent.expiresAt).toBeDefined();
    }
  });

  it("Task 5 / BR-PAP-01, BR-PAP-05: Row lock approval transaction and stacked expiry date", async () => {
    const pkg = PACKAGE_CATALOG["PKG-standard"];
    if (!pkg?.offers[0]) {
      throw new Error("PKG-standard not found");
    }
    const orderUuid = crypto.randomUUID();
    const transferNote = formatTransferNote(orderUuid);

    await db.insert(paymentOrders).values({
      uuid: orderUuid,
      userId: testUserId,
      packageCode: pkg.code,
      offerCode: "annual",
      amountVnd: pkg.offers[0].price_vnd,
      currency: "VND",
      status: PAYMENT_ORDER_STATUS.SUBMITTED,
      transferNote,
      bankTxnRef: "FT24081412345678",
      submittedAt: new Date(),
    });

    const bonusDays = 5;
    const adminNote = "Đã đối soát sao kê MB Bank khớp 100%.";
    const now = new Date();

    // Manager approves inside SQLite write-serialized transaction
    await db.transaction(async (tx) => {
      const [lockedOrder] = await tx
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.uuid, orderUuid));
      if (!lockedOrder) {
        throw new Error("Failed to lock order");
      }

      expect(lockedOrder.status).toBe(PAYMENT_ORDER_STATUS.SUBMITTED);
      assertPaymentOrderTransition(
        PAYMENT_ORDER_STATUS_CODEC.toLabel(lockedOrder.status),
        "approved"
      );

      await tx
        .update(paymentOrders)
        .set({
          status: PAYMENT_ORDER_STATUS.APPROVED,
          reviewedAt: now,
          reviewedByManagerId: testManagerId,
          adminNote,
          updatedAt: now,
        })
        .where(eq(paymentOrders.id, lockedOrder.id));

      for (const key of pkg.entitlements) {
        const stackedExpiresAt = computeStackedExpiryDate(
          undefined,
          365,
          bonusDays,
          now
        );

        await tx.insert(entitlements).values({
          userId: testUserId,
          entitlementKey: key,
          source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
          sourceRef: lockedOrder.uuid,
          status: ENTITLEMENT_STATUS.ACTIVE,
          expiresAt: stackedExpiresAt,
          grantedByManagerId: testManagerId,
          grantReason: adminNote,
        });
      }

      await tx.insert(auditLogs).values({
        actorType: ACTOR_TYPE.MANAGER,
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
    expect(finalOrder?.status).toBe(PAYMENT_ORDER_STATUS.APPROVED);

    // Verify active entitlements granted with stacked expiry
    const activeEnts = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, testUserId),
          eq(entitlements.status, ENTITLEMENT_STATUS.ACTIVE)
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
    if (!pkg?.offers[0]) {
      throw new Error("PKG-standard not found");
    }
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
        status: PAYMENT_ORDER_STATUS.SUBMITTED,
        bankTxnRef: "FT240814FAKE1234",
        submittedAt: new Date(),
      })
      .returning();
    if (!order) {
      throw new Error("Failed to insert order");
    }

    // Create soft_unlock entitlement
    for (const key of pkg.entitlements) {
      await db.insert(entitlements).values({
        userId: testUserId,
        entitlementKey: key,
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: order.uuid,
        status: ENTITLEMENT_STATUS.SOFT_UNLOCK,
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
        .where(eq(paymentOrders.uuid, orderUuid));
      if (!lockedOrder) {
        throw new Error("Failed to lock order");
      }

      assertPaymentOrderTransition(
        PAYMENT_ORDER_STATUS_CODEC.toLabel(lockedOrder.status),
        "rejected"
      );

      await tx
        .update(paymentOrders)
        .set({
          status: PAYMENT_ORDER_STATUS.REJECTED,
          reviewedAt: new Date(),
          reviewedByManagerId: testManagerId,
          adminNote: rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, lockedOrder.id));

      await tx
        .update(entitlements)
        .set({
          status: ENTITLEMENT_STATUS.CANCELLED,
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

    expect(
      postRejectionEnts.every((e) => e.status === ENTITLEMENT_STATUS.CANCELLED)
    ).toBe(true);
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
        status: PAYMENT_ORDER_STATUS.PENDING,
        expiresAt: expiredPendingDate,
      })
      .returning();
    if (!expiredPending) {
      throw new Error("Failed to insert expiredPending");
    }

    // 2. Setup submitted order with expired soft_unlock entitlement (> 3 days ago) on another package
    const submittedOrderUuid = crypto.randomUUID();
    await db.insert(paymentOrders).values({
      uuid: submittedOrderUuid,
      userId: testUserId,
      packageCode: "PKG-premium",
      offerCode: "annual",
      amountVnd:
        PACKAGE_CATALOG["PKG-premium"]?.offers[0]?.price_vnd ?? 999_000,
      currency: "VND",
      status: PAYMENT_ORDER_STATUS.SUBMITTED,
      submittedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    });

    const expiredSoftUnlockDate = new Date(Date.now() - 1 * 3600 * 1000);
    await db.insert(entitlements).values({
      userId: testUserId,
      entitlementKey: "play_premium_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      sourceRef: submittedOrderUuid,
      status: ENTITLEMENT_STATUS.SOFT_UNLOCK,
      expiresAt: expiredSoftUnlockDate,
    });

    // Run sweep jobs
    await runExpirePaymentOrders();
    const [refreshedExpiredPending] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.uuid, expiredPending.uuid));
    expect(refreshedExpiredPending?.status).toBe(PAYMENT_ORDER_STATUS.EXPIRED);

    await runExpireSoftUnlockEntitlements();
    const [refreshedEntitlement] = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, testUserId),
          eq(entitlements.sourceRef, submittedOrderUuid)
        )
      );
    expect(refreshedEntitlement?.status).toBe(ENTITLEMENT_STATUS.EXPIRED);

    // D-JL Check: Order MUST STILL be 'submitted' even when soft_unlock expired!
    const [refreshedSubmittedOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.uuid, submittedOrderUuid));
    expect(refreshedSubmittedOrder?.status).toBe(
      PAYMENT_ORDER_STATUS.SUBMITTED
    );
  });

  it("Task 2 / BR-POC-04: Rejects duplicate open payment orders for the same (user_id, package_code) via uq_payment_orders_user_pkg_open", async () => {
    const pkg = PACKAGE_CATALOG["PKG-standard"];
    if (!pkg?.offers[0]) {
      throw new Error("PKG-standard not found");
    }

    const [firstOrder] = await db
      .insert(paymentOrders)
      .values({
        uuid: crypto.randomUUID(),
        userId: testUserId,
        packageCode: pkg.code,
        offerCode: pkg.offers[0].offer_code,
        amountVnd: pkg.offers[0].price_vnd,
        currency: "VND",
        status: PAYMENT_ORDER_STATUS.PENDING,
        expiresAt: computeOrderPendingExpiresAt(),
      })
      .returning();
    if (!firstOrder) {
      throw new Error("Expected first open order");
    }

    await expect(
      db.insert(paymentOrders).values({
        uuid: crypto.randomUUID(),
        userId: testUserId,
        packageCode: pkg.code,
        offerCode: pkg.offers[0].offer_code,
        amountVnd: pkg.offers[0].price_vnd,
        currency: "VND",
        status: PAYMENT_ORDER_STATUS.SUBMITTED,
        submittedAt: new Date(),
      })
    ).rejects.toThrow(UNIQUE_OPEN_ORDER_REGEX);

    await db
      .update(paymentOrders)
      .set({ status: PAYMENT_ORDER_STATUS.CANCELLED, updatedAt: new Date() })
      .where(eq(paymentOrders.id, firstOrder.id));

    const [replacementOrder] = await db
      .insert(paymentOrders)
      .values({
        uuid: crypto.randomUUID(),
        userId: testUserId,
        packageCode: pkg.code,
        offerCode: pkg.offers[0].offer_code,
        amountVnd: pkg.offers[0].price_vnd,
        currency: "VND",
        status: PAYMENT_ORDER_STATUS.PENDING,
        expiresAt: computeOrderPendingExpiresAt(),
      })
      .returning();
    expect(replacementOrder?.status).toBe(PAYMENT_ORDER_STATUS.PENDING);
  });
});
