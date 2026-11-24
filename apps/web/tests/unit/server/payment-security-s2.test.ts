import type {
  EntitlementSource,
  EntitlementStatus,
  PaymentOrderStatus,
} from "@mindkid/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface FakeOrder {
  id: number;
  uuid: string;
  userId: number;
  packageCode: string;
  offerCode: string;
  amountVnd: number;
  currency: string;
  status: PaymentOrderStatus;
  transferNote: string;
  bankTxnRef: string | null;
  proofPath: string | null;
  submittedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

interface FakeEntitlement {
  id: number;
  userId: number;
  entitlementKey: string;
  source: EntitlementSource;
  sourceRef: string | null;
  status: EntitlementStatus;
  expiresAt: Date | null;
}

const s2State: {
  order: FakeOrder;
  hasExistingPendingOrder: boolean;
  priorRejectedOrders: FakeOrder[];
  entitlements: FakeEntitlement[];
  insertedEntitlements: FakeEntitlement[];
  updatedEntitlements: Partial<FakeEntitlement>[];
  auditCalls: Record<string, string | number | object | null>[];
} = {
  order: {
    id: 10,
    uuid: "00000000-0000-4000-8000-000000000010",
    userId: 77,
    packageCode: "PKG-standard",
    offerCode: "annual",
    amountVnd: 599_000,
    currency: "VND",
    status: 2 as PaymentOrderStatus,
    transferNote: "TM00000010",
    bankTxnRef: null,
    proofPath: null,
    submittedAt: null,
    expiresAt: new Date(Date.now() + 3_600_000),
    createdAt: new Date(),
  },
  hasExistingPendingOrder: true,
  priorRejectedOrders: [],
  entitlements: [],
  insertedEntitlements: [],
  updatedEntitlements: [],
  auditCalls: [],
};

vi.mock("@mindkid/audit", () => ({
  writeAudit: (
    _tx: object,
    entry: Record<string, string | number | object | null>
  ) => {
    s2State.auditCalls.push(entry);
    return Promise.resolve();
  },
}));

vi.mock("#server/utils/entitlements-runtime", () => ({
  invalidateUserEntitlementsCache: () => Promise.resolve(),
}));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    getRouterParam: () => s2State.order.uuid,
    readMultipartFormData: () =>
      Promise.resolve([
        {
          name: "bank_txn_ref",
          data: Buffer.from("FT261024999999", "utf-8"),
        },
      ]),
  };
});

vi.mock("@mindkid/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/db")>();
  const makeSelectChain = () => {
    let currentTable: object | null = null;
    const chain = {
      from: (table: object) => {
        currentTable = table;
        return chain;
      },
      where: () => chain,
      for: () => Promise.resolve([s2State.order]),
      limit: () => {
        if (currentTable === actual.paymentOrders) {
          return Promise.resolve(
            s2State.hasExistingPendingOrder ? [s2State.order] : []
          );
        }
        if (currentTable === actual.entitlements) {
          return Promise.resolve(s2State.entitlements);
        }
        return Promise.resolve([
          {
            id: 77,
            status: actual.USER_STATUS.ACTIVE,
            email: "u77@example.com",
            displayName: "U77",
          },
        ]);
      },
    };
    return chain;
  };

  let txOrderSelectCount = 0;
  const TEST_PKG_PRICE = 599_000;

  const makeQuery = (isTx: boolean) => ({
    users: {
      findFirst: () =>
        Promise.resolve({
          id: 77,
          status: actual.USER_STATUS.ACTIVE,
          email: "u77@example.com",
          displayName: "U77",
        }),
    },
    packages: {
      findFirst: () =>
        Promise.resolve({
          code: "PKG-standard",
          name: "Tiêu chuẩn",
          audience: "Người dùng phổ thông",
          description: "Gói tiêu chuẩn",
          isPublic: true,
          isFeatured: false,
          status: actual.PACKAGE_STATUS.ACTIVE,
          offers: [
            {
              offer_code: "annual",
              billing_period: "1 năm",
              price_vnd: TEST_PKG_PRICE,
              duration_days: 365,
            },
          ],
          quotas: { child_profiles: 3, daily_play_minutes: 60 },
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    },
    paymentOrders: {
      findFirst: () => {
        if (isTx) {
          txOrderSelectCount += 1;
          return Promise.resolve(
            txOrderSelectCount === 1
              ? s2State.order
              : (s2State.priorRejectedOrders[0] ?? undefined)
          );
        }
        return Promise.resolve(
          s2State.hasExistingPendingOrder ? s2State.order : null
        );
      },
      findMany: () => Promise.resolve(s2State.priorRejectedOrders),
    },
    entitlements: {
      findFirst: () => Promise.resolve(s2State.entitlements[0] ?? null),
      findMany: () => Promise.resolve(s2State.entitlements),
    },
  });

  const fakeTx = {
    query: makeQuery(true),
    select: () => {
      let currentTable: object | null = null;
      const chain = {
        from: (table: object) => {
          currentTable = table;
          if (table === actual.paymentOrders) {
            txOrderSelectCount += 1;
          }
          return chain;
        },
        where: () => chain,
        for: () => Promise.resolve([s2State.order]),
        limit: () => {
          const callIndex = txOrderSelectCount;
          const resolveLimit = (): Promise<object[]> => {
            if (currentTable === actual.paymentOrders) {
              if (callIndex === 1) {
                return Promise.resolve([s2State.order]);
              }
              return Promise.resolve(s2State.priorRejectedOrders);
            }
            if (currentTable === actual.entitlements) {
              return Promise.resolve(s2State.entitlements);
            }
            return Promise.resolve([]);
          };
          const promise = resolveLimit();
          return Object.assign(promise, {
            for: () => Promise.resolve([s2State.order]),
          });
        },
      };
      return chain;
    },
    update: (table: object) => ({
      set: (values: Record<string, string | number | Date | null>) => {
        if (table === actual.entitlements) {
          s2State.updatedEntitlements.push(values);
        } else if (
          table === actual.paymentOrders &&
          typeof values.status === "number"
        ) {
          s2State.order.status = values.status as PaymentOrderStatus;
        }
        return {
          where: () => {
            const updatedRow =
              table === actual.entitlements
                ? {
                    id: 1,
                    userId: 77,
                    entitlementKey: "play_standard_games",
                    source: actual.ENTITLEMENT_SOURCE.PACKAGE_ORDER,
                    sourceRef: s2State.order.uuid,
                    status:
                      values.status ?? actual.ENTITLEMENT_STATUS.SOFT_UNLOCK,
                    grantedAt: new Date(),
                    expiresAt: values.expiresAt ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }
                : s2State.order;
            return Object.assign(Promise.resolve([updatedRow]), {
              returning: () => Promise.resolve([updatedRow]),
            });
          },
        };
      },
    }),
    insert: (table: object) => ({
      values: (val: FakeEntitlement) => {
        if (table === actual.entitlements) {
          s2State.insertedEntitlements.push(val);
        }
        return {
          returning: () => Promise.resolve([s2State.order]),
        };
      },
    }),
  };

  return {
    ...actual,
    getOwnerDb: () => ({
      query: makeQuery(false),
      select: makeSelectChain,
      insert: fakeTx.insert,
      update: fakeTx.update,
      transaction: <T>(fn: (tx: typeof fakeTx) => Promise<T>) => {
        txOrderSelectCount = 0;
        return fn(fakeTx);
      },
    }),
    getDb: () => ({
      query: makeQuery(false),
      select: makeSelectChain,
      insert: fakeTx.insert,
      update: fakeTx.update,
      transaction: <T>(fn: (tx: typeof fakeTx) => Promise<T>) => {
        txOrderSelectCount = 0;
        return fn(fakeTx);
      },
    }),
  };
});

import {
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  PAYMENT_ORDER_STATUS,
} from "@mindkid/db";
import { requestExportJob } from "@mindkid/export";
import proofHandler from "#server/api/users/orders/[uuid]/proof.post";
import createOrderHandler from "#server/api/users/orders/index.post";

function createUserEvent(body: Record<string, string | number> = {}) {
  const csrf = "a".repeat(64);
  return {
    method: "POST",
    context: {
      user: {
        user_id: 77,
        display_name: "U77",
        session_id: "sess_77",
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

describe("Task #313 S2 — Payment Proof Soft-Unlock, VietQR Fail-Closed & Entitlement Safety", () => {
  beforeEach(() => {
    s2State.order = {
      id: 10,
      uuid: "00000000-0000-4000-8000-000000000010",
      userId: 77,
      packageCode: "PKG-standard",
      offerCode: "annual",
      amountVnd: 599_000,
      currency: "VND",
      status: PAYMENT_ORDER_STATUS.PENDING,
      transferNote: "TM00000010",
      bankTxnRef: null,
      proofPath: null,
      submittedAt: null,
      expiresAt: new Date(Date.now() + 3_600_000),
      createdAt: new Date(),
    };
    s2State.hasExistingPendingOrder = true;
    s2State.priorRejectedOrders = [];
    s2State.entitlements = [];
    s2State.insertedEntitlements = [];
    s2State.updatedEntitlements = [];
    s2State.auditCalls = [];
  });

  it("[C-02] từ chối nộp chứng từ khi đơn hàng đã quá hạn expiresAt", async () => {
    s2State.order.expiresAt = new Date(Date.now() - 60_000);

    await expect(
      proofHandler(createUserEvent() as never)
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "INVALID_STATUS_TRANSITION",
    });
  });

  it("[C-02] không cấp lại soft_unlock nếu user đã từng có đơn bị rejected cho cùng gói (chống lạm dụng xoay vòng)", async () => {
    s2State.priorRejectedOrders = [
      {
        ...s2State.order,
        id: 9,
        uuid: "00000000-0000-4000-8000-000000000009",
        status: PAYMENT_ORDER_STATUS.REJECTED,
        submittedAt: new Date(Date.now() - 86_400_000),
      },
    ];
    s2State.entitlements = [
      {
        id: 1,
        userId: 77,
        entitlementKey: "play_standard_games",
        source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
        sourceRef: "00000000-0000-4000-8000-000000000009",
        status: ENTITLEMENT_STATUS.CANCELLED,
        expiresAt: new Date(Date.now() - 3_600_000),
      },
    ];

    const res = await proofHandler(createUserEvent() as never);
    expect(res.status).toBe("submitted");
    expect(res.soft_unlock_until).toBeNull();
    expect(s2State.insertedEntitlements).toHaveLength(0);
    expect(s2State.updatedEntitlements).toHaveLength(0);
    expect(s2State.auditCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("[H-09] tạo đơn hàng phải fail-closed (503 SERVICE_UNAVAILABLE) khi thiếu cấu hình VIETQR, không được fallback sang STK giả 1234567890", async () => {
    s2State.hasExistingPendingOrder = false;
    const prevBankName = process.env.VIETQR_BANK_NAME;
    const prevAccountNo = process.env.VIETQR_ACCOUNT_NO;
    Reflect.deleteProperty(process.env, "VIETQR_BANK_NAME");
    Reflect.deleteProperty(process.env, "VIETQR_ACCOUNT_NO");

    try {
      await expect(
        createOrderHandler(
          createUserEvent({
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
    s2State.order.status = PAYMENT_ORDER_STATUS.PENDING_PROOF;

    const res = await proofHandler(createUserEvent() as never);
    expect(res.status).toBe("submitted");
    expect(res.soft_unlock_until).toBeInstanceOf(Date);
    expect(s2State.insertedEntitlements.length).toBeGreaterThanOrEqual(1);
    expect(s2State.auditCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("[H-11] requestExportJob không truyền userEntitlements phải fail-closed (ném ENTITLEMENT_REQUIRED) thay vì tự cấp quyền mặc định", async () => {
    await expect(
      requestExportJob(
        77,
        "curriculum_plan",
        "00000000-0000-4000-8000-000000000099"
      )
    ).rejects.toMatchObject({
      code: "ENTITLEMENT_REQUIRED",
    });
  });
});
