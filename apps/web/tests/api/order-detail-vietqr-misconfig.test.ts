import {
  getOwnerDb,
  PAYMENT_ORDER_STATUS,
  packages,
  paymentOrders,
  SEED_PACKAGES,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { ServiceUnavailableError } from "@mindkid/errors";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getUserOrderDetail } from "#server/services/order-service";

describe("BR-APM-03 — VietQR chưa cấu hình không được trả tài khoản giả", () => {
  it("getUserOrderDetail ném ServiceUnavailableError khi thiếu VIETQR_ACCOUNT_NO", async () => {
    const db = getOwnerDb();
    const [user] = await db
      .insert(users)
      .values({
        email: `vietqr-misconfig-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "VietQR Misconfig",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    const saved = process.env.VIETQR_ACCOUNT_NO;
    try {
      for (const pkg of SEED_PACKAGES) {
        await db.insert(packages).values(pkg).onConflictDoNothing();
      }
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
      delete process.env.VIETQR_ACCOUNT_NO;
      let caught: Error | null = null;
      let output = "";
      try {
        output = JSON.stringify(await getUserOrderDetail(user.id, orderUuid));
      } catch (error) {
        caught = error instanceof Error ? error : null;
      }
      expect(caught).toBeInstanceOf(ServiceUnavailableError);
      expect(output).not.toContain("1234567890");
    } finally {
      if (saved !== undefined) {
        process.env.VIETQR_ACCOUNT_NO = saved;
      }
      await db.delete(paymentOrders).where(eq(paymentOrders.userId, user.id));
      await db.delete(users).where(eq(users.id, user.id));
    }
  });
});
