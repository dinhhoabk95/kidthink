import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/index.ts";
import {
  entitlements,
  packages,
  paymentOrders,
} from "../../src/schema/billing.ts";
import { users } from "../../src/schema/identity.ts";

describe("Billing Schema Integration Tests", () => {
  it("BR-SIB-02: entitlements.entitlement_key is a real FK to entitlement_keys", async () => {
    const db = getOwnerDb();
    const email = `billing-u1-${Date.now()}@example.com`;

    const [u] = await db
      .insert(users)
      .values({ email, displayName: "Billing User 1" })
      .returning();

    // Inserting entitlement with non-existent key must be rejected by Postgres FK
    await expect(
      db.insert(entitlements).values({
        userId: u.id,
        entitlementKey: "NON_EXISTENT_KEY",
        source: "manual_grant",
        status: "active",
      })
    ).rejects.toThrow();
  });

  it("BR-SIB-03: payment_orders.amount_vnd is a snapshot that does not change when packages price updates", async () => {
    const db = getOwnerDb();
    const email = `billing-u2-${Date.now()}@example.com`;

    const [u] = await db
      .insert(users)
      .values({ email, displayName: "Billing User 2" })
      .returning();

    const pkgCode = `PKG-TEST-${Date.now()}`;
    try {
      await db.insert(packages).values({
        code: pkgCode,
        nameVi: "Gói Test",
        audienceVi: "Người dùng",
        descriptionVi: "Mô tả",
        isPublic: true,
        isFeatured: false,
        status: "active",
        offers: [
          {
            offer_code: "yearly_standard",
            billing_period: "yearly",
            price_vnd: 500_000,
            duration_days: 365,
          },
        ],
      });

      // Create payment order with snapshot amount 500000
      const [order] = await db
        .insert(paymentOrders)
        .values({
          userId: u.id,
          packageCode: pkgCode,
          offerCode: "yearly_standard",
          amountVnd: 500_000,
          currency: "VND",
          status: "pending_proof",
        })
        .returning();

      expect(order.amountVnd).toBe(500_000);

      // Now update price in package to 600000
      await db
        .update(packages)
        .set({
          offers: [
            {
              offer_code: "yearly_standard",
              billing_period: "yearly",
              price_vnd: 600_000,
              duration_days: 365,
            },
          ],
        })
        .where(eq(packages.code, pkgCode));

      // Verify old order's amountVnd is still 500000
      const [fetchedOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, order.id));

      expect(fetchedOrder.amountVnd).toBe(500_000);
    } finally {
      await db
        .delete(paymentOrders)
        .where(eq(paymentOrders.packageCode, pkgCode));
      await db.delete(packages).where(eq(packages.code, pkgCode));
    }
  });
});
