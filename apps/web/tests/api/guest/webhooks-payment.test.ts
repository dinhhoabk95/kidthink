import { AppError } from "@mindkid/auth";
import {
  entitlementKeys,
  getOwnerDb,
  packages,
  paymentOrders,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@mindkid/db";
import { computePaymentWebhookSignature } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import paymentWebhookHandler from "#server/api/guest/webhooks/payments/[provider].post";

const RE_INVALID_PAYMENT_PROVIDER =
  /không được hỗ trợ|VALIDATION_FAILED|INVALID_PAYMENT_PROVIDER/;
const RE_WEBHOOK_SIGNATURE_INVALID =
  /Chữ ký|không hợp lệ|WEBHOOK_SIGNATURE_INVALID/;

function mockWebhookEvent(params: {
  provider: string;
  body: unknown;
  signature?: string;
}) {
  const rawBody = params.body;

  return {
    method: "POST",
    node: {
      req: {
        headers: {
          ...(params.signature
            ? { "x-webhook-signature": params.signature }
            : {}),
        },
      },
      res: {},
    },
    context: {
      params: { provider: params.provider },
      body: rawBody,
    },
    _body: rawBody,
    body: rawBody,
  } as unknown as Parameters<typeof paymentWebhookHandler>[0];
}

describe("POST /api/guest/webhooks/payments/[provider] (BR-APM-01..07)", () => {
  // Route giải bí mật qua `requireFirstEnv([PAYMENT_<PROVIDER>_WEBHOOK_SECRET,
  // PAYMENT_WEBHOOK_SECRET])`. Hằng số cứng ở đây từng làm ca "chữ ký hợp lệ"
  // đỏ vĩnh viễn, và hai ca âm thì xanh vì mọi chữ ký đều sai — đường thành
  // công chưa từng được kiểm.
  const secretKey =
    process.env.PAYMENT_PAYOS_WEBHOOK_SECRET ??
    process.env.PAYMENT_WEBHOOK_SECRET ??
    "";

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

  it("Scenario: rejects invalid or unsupported provider with 400", async () => {
    const event = mockWebhookEvent({
      provider: "unsupported_gateway",
      body: {},
    });

    await expect(paymentWebhookHandler(event)).rejects.toThrowError(
      RE_INVALID_PAYMENT_PROVIDER
    );
  });

  it("Scenario: rejects invalid HMAC signature with 401", async () => {
    const payload = {
      provider: "payos",
      provider_event_id: `evt_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
      order_uuid: "00000000-0000-0000-0000-000000000001",
      amount_vnd: 299_000,
      status: "success",
      timestamp_seconds: Math.floor(Date.now() / 1000),
      merchant_id: "test_merchant",
    };

    const event = mockWebhookEvent({
      provider: "payos",
      body: payload,
      signature: "invalid_hex_signature_12345",
    });

    await expect(paymentWebhookHandler(event)).rejects.toThrowError(
      RE_WEBHOOK_SIGNATURE_INVALID
    );
  });

  it("Scenario: successfully processes valid webhook with signature", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `webhook_user_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Webhook User",
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

    const payload = {
      provider: "payos",
      provider_event_id: `evt_valid_${Date.now()}`,
      order_uuid: order.uuid,
      amount_vnd: 299_000,
      status: "success",
      timestamp_seconds: Math.floor(Date.now() / 1000),
      merchant_id: "test_merchant",
    };

    const signature = computePaymentWebhookSignature(
      JSON.stringify(payload),
      secretKey
    );

    const event = mockWebhookEvent({
      provider: "payos",
      body: payload,
      signature,
    });

    const response = await paymentWebhookHandler(event);

    expect(response.ok).toBe(true);
    expect(response.order_status).toBe("approved");
    expect(response.is_duplicate).toBe(false);

    // Verify order was marked approved in DB
    const [updated] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, order.id));
    expect(updated.status).toBe("approved");
  });
  it("Scenario: rejects an unsigned webhook instead of approving the order", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `webhook_unsigned_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`,
        displayName: "Unsigned Webhook User",
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

    // ❌ NEVER bỏ qua xác minh khi người gọi không gửi chữ ký: bỏ header đi là
    // cách rẻ nhất để duyệt một đơn chưa trả tiền (BR-APM-01).
    const event = mockWebhookEvent({
      provider: "payos",
      body: {
        provider: "payos",
        provider_event_id: `evt_unsigned_${Date.now()}`,
        order_uuid: order.uuid,
        amount_vnd: 299_000,
        status: "success",
        timestamp_seconds: Math.floor(Date.now() / 1000),
        merchant_id: "test_merchant",
      },
    });

    await expect(paymentWebhookHandler(event)).rejects.toThrowError(
      RE_WEBHOOK_SIGNATURE_INVALID
    );

    const [unchanged] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, order.id));
    expect(unchanged.status).toBe("pending");
  });

  it("Scenario: signature rejection carries the registered 401 error code", async () => {
    const event = mockWebhookEvent({
      provider: "payos",
      body: {
        provider: "payos",
        provider_event_id: `evt_code_${Date.now()}`,
        order_uuid: "00000000-0000-0000-0000-000000000001",
        amount_vnd: 299_000,
        status: "success",
        timestamp_seconds: Math.floor(Date.now() / 1000),
        merchant_id: "test_merchant",
      },
      signature: "invalid_hex_signature_12345",
    });

    let thrown: unknown;
    try {
      await paymentWebhookHandler(event);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);
    expect((thrown as AppError).code).toBe("WEBHOOK_SIGNATURE_INVALID");
    expect((thrown as AppError).status).toBe(401);
  });
});
