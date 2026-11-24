import {
  getOwnerDb,
  type JsonValue,
  PAYMENT_ORDER_STATUS,
  packages,
  paymentOrders,
  SEED_PACKAGES,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { OrderAlreadyPendingError } from "@mindkid/errors";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createUserOrder } from "#server/services/order-service";

describe("BR-POC-04 — đơn pending trùng gói trả OrderAlreadyPendingError, không phải 500", () => {
  it("tạo đơn thứ hai cho cùng gói bị chặn bằng lỗi nghiệp vụ", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `dup-pending-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Dup Pending",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    let originalOffers: JsonValue | undefined;
    try {
      for (const pkg of SEED_PACKAGES) {
        await db.insert(packages).values(pkg).onConflictDoNothing();
      }
      const [original] = await db
        .select({ offers: packages.offers })
        .from(packages)
        .where(eq(packages.code, "PKG-standard"));
      originalOffers = original?.offers;
      await db
        .update(packages)
        .set({
          offers: [
            {
              offer_code: "annual",
              billing_period: "annual",
              price_vnd: 599_000,
              duration_days: 365,
            },
          ],
        })
        .where(eq(packages.code, "PKG-standard"));
      const orderUuid = crypto.randomUUID();
      await db.insert(paymentOrders).values({
        uuid: orderUuid,
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        amountVnd: 599_000,
        status: PAYMENT_ORDER_STATUS.PENDING,
        transferNote: `TM${orderUuid.slice(0, 8).toUpperCase()}`,
        expiresAt: new Date(Date.now() + 3_600_000),
      });

      await expect(
        createUserOrder({
          userId: user.id,
          packageCode: "PKG-standard",
          offerCode: "annual",
          ipAddress: "127.0.0.1",
          userAgent: "vitest",
        })
      ).rejects.toBeInstanceOf(OrderAlreadyPendingError);
    } finally {
      if (originalOffers !== undefined) {
        await db
          .update(packages)
          .set({ offers: originalOffers })
          .where(eq(packages.code, "PKG-standard"));
      }
      await db.delete(paymentOrders).where(eq(paymentOrders.userId, user.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  });
});
