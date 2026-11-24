import {
  auditLogs,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  PAYMENT_ORDER_STATUS,
  type PaymentOrderStatus,
  packages,
  paymentOrders,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { requestExportJob } from "@mindkid/export";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// DB thật (BR-TST-02): user, đơn hàng, entitlement và audit đều là hàng trong SQLite test.
const s2State: { orderUuid: string } = { orderUuid: "" };

vi.mock("#server/utils/entitlements-runtime", () => ({
  invalidateUserEntitlementsCache: () => Promise.resolve(),
}));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    getRouterParam: () => s2State.orderUuid,
    readMultipartFormData: () =>
      Promise.resolve([
        {
          name: "bank_txn_ref",
          data: Buffer.from("FT261024999999", "utf-8"),
        },
      ]),
  };
});

import proofHandler from "#server/api/users/orders/[uuid]/proof.post";
import createOrderHandler from "#server/api/users/orders/index.post";

function createUserEvent(
  userId: number,
  body: Record<string, string | number> = {}
) {
  const csrf = "a".repeat(64);
  return {
    method: "POST",
    context: {
      user: {
        user_id: userId,
        display_name: "U",
        session_id: `sess_${userId}`,
      },
      body,
    },
    _body: body,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrf,
          cookie: `tm_u_csrf=${csrf}`,
          "sec-fetch-site": "same-origin",
        },
        socket: { remoteAddress: "127.0.0.1" },
      },
      res: {
        setHeader: () => undefined,
        getHeader: () => undefined,
      },
    },
  };
}

let userId = 0;
let originalOffers: (typeof packages.$inferSelect)["offers"] | null = null;
let seq = 0;
const createdOrderIds: number[] = [];

async function insertOrder(
  status: PaymentOrderStatus,
  overrides: Partial<typeof paymentOrders.$inferInsert> = {}
): Promise<{ id: number; uuid: string }> {
  seq += 1;
  const [row] = await getOwnerDb()
    .insert(paymentOrders)
    .values({
      userId,
      packageCode: "PKG-standard",
      offerCode: "annual",
      amountVnd: 599_000,
      status,
      transferNote: `TMS2${Date.now()}${seq}`,
      expiresAt: new Date(Date.now() + 3_600_000),
      ...overrides,
    })
    .returning();
  if (!row) {
    throw new Error("seed order failed");
  }
  createdOrderIds.push(row.id);
  return { id: row.id, uuid: row.uuid };
}

async function userEntitlementCount(): Promise<number> {
  const rows = await getOwnerDb()
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(eq(entitlements.userId, userId));
  return rows.length;
}

async function auditCountFor(orderUuid: string): Promise<number> {
  const rows = await getOwnerDb()
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityId, orderUuid),
        eq(auditLogs.action, "payment_proof_submitted")
      )
    );
  return rows.length;
}

describe("Task #313 S2 — Payment Proof Soft-Unlock, VietQR Fail-Closed & Entitlement Safety", () => {
  beforeEach(async () => {
    const db = getOwnerDb();
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    // Giá catalog đang PENDING nên đặt bảng giá thật cho gói trong DB test (khôi phục ở afterEach).
    const [pkgRow] = await db
      .select({ offers: packages.offers })
      .from(packages)
      .where(eq(packages.code, "PKG-standard"));
    originalOffers = pkgRow?.offers ?? null;
    await db
      .update(packages)
      .set({
        offers: [
          {
            offer_code: "annual",
            billing_period: "1 năm",
            price_vnd: 599_000,
            duration_days: 365,
          },
        ],
      })
      .where(eq(packages.code, "PKG-standard"));
    seq += 1;
    const [u] = await db
      .insert(users)
      .values({
        email: `s2-${Date.now()}-${seq}@example.com`,
        displayName: "U-S2",
        emailVerified: true,
        emailVerifiedAt: new Date("2026-07-01T00:00:00Z"),
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!u) {
      throw new Error("seed user failed");
    }
    userId = u.id;
    createdOrderIds.length = 0;
  });

  afterEach(async () => {
    const db = getOwnerDb();
    await db.delete(entitlements).where(eq(entitlements.userId, userId));
    await db.delete(paymentOrders).where(eq(paymentOrders.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    if (originalOffers !== null) {
      await db
        .update(packages)
        .set({ offers: originalOffers })
        .where(eq(packages.code, "PKG-standard"));
    }
  });

  it("[C-02] từ chối nộp chứng từ khi đơn hàng đã quá hạn expiresAt", async () => {
    const order = await insertOrder(PAYMENT_ORDER_STATUS.PENDING, {
      expiresAt: new Date(Date.now() - 60_000),
    });
    s2State.orderUuid = order.uuid;

    await expect(
      proofHandler(createUserEvent(userId) as never)
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "INVALID_STATUS_TRANSITION",
    });
  });

  it("[C-02] không cấp lại soft_unlock nếu user đã từng có đơn bị rejected cho cùng gói (chống lạm dụng xoay vòng)", async () => {
    const prior = await insertOrder(PAYMENT_ORDER_STATUS.REJECTED, {
      submittedAt: new Date(Date.now() - 86_400_000),
    });
    await getOwnerDb()
      .insert(entitlements)
      .values({
        userId,
        entitlementKey: "play_standard_games",
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: prior.uuid,
        status: ENTITLEMENT_STATUS.CANCELLED,
        expiresAt: new Date(Date.now() - 3_600_000),
      });
    const order = await insertOrder(PAYMENT_ORDER_STATUS.PENDING);
    s2State.orderUuid = order.uuid;
    const before = await userEntitlementCount();

    const res = await proofHandler(createUserEvent(userId) as never);
    expect(res.status).toBe("submitted");
    expect(res.soft_unlock_until).toBeNull();
    expect(await userEntitlementCount()).toBe(before);
    expect(await auditCountFor(order.uuid)).toBeGreaterThanOrEqual(1);
  });

  it("[H-09] tạo đơn hàng phải fail-closed (503 SERVICE_UNAVAILABLE) khi thiếu cấu hình VIETQR, không được fallback sang STK giả 1234567890", async () => {
    const prevBankName = process.env.VIETQR_BANK_NAME;
    const prevAccountNo = process.env.VIETQR_ACCOUNT_NO;
    Reflect.deleteProperty(process.env, "VIETQR_BANK_NAME");
    Reflect.deleteProperty(process.env, "VIETQR_ACCOUNT_NO");

    try {
      await expect(
        createOrderHandler(
          createUserEvent(userId, {
            package_code: "PKG-standard",
            offer_code: "annual",
          }) as never
        )
      ).rejects.toMatchObject({
        statusCode: 503,
        code: "SERVICE_UNAVAILABLE",
      });
    } finally {
      if (prevBankName !== undefined) {
        process.env.VIETQR_BANK_NAME = prevBankName;
      }
      if (prevAccountNo !== undefined) {
        process.env.VIETQR_ACCOUNT_NO = prevAccountNo;
      }
    }
  });

  it("[C-02] đơn hàng ở trạng thái pending_proof nộp chứng từ lần đầu hợp lệ vẫn được cấp soft_unlock", async () => {
    const order = await insertOrder(PAYMENT_ORDER_STATUS.PENDING_PROOF);
    s2State.orderUuid = order.uuid;

    const res = await proofHandler(createUserEvent(userId) as never);
    expect(res.status).toBe("submitted");
    expect(res.soft_unlock_until).toBeInstanceOf(Date);
    expect(await userEntitlementCount()).toBeGreaterThanOrEqual(1);
    expect(await auditCountFor(order.uuid)).toBeGreaterThanOrEqual(1);
  });

  it("[H-11] requestExportJob không truyền userEntitlements phải fail-closed (ném ENTITLEMENT_REQUIRED) thay vì tự cấp quyền mặc định", async () => {
    await expect(
      requestExportJob(
        userId,
        "curriculum_plan",
        "00000000-0000-4000-8000-000000000099"
      )
    ).rejects.toMatchObject({
      code: "ENTITLEMENT_REQUIRED",
    });
  });
});
