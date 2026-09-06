import { getDb, paymentOrders, users } from "@mindkid/db";
import { UnauthenticatedError } from "@mindkid/errors/auth";
import {
  OfferNotFoundError,
  OrderAlreadyPendingError,
  PackageNotFoundError,
  PackageNotSellableError,
} from "@mindkid/errors/billing";
import { InternalError } from "@mindkid/errors/common";
import {
  computeOrderPendingExpiresAt,
  formatTransferNote,
  generateVietQrPayload,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { throwValidationError } from "#server/utils/api-error";
import {
  assertUnrestrictedUser,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const createOrderSchema = z.object({
  package_code: z.string().min(1),
  offer_code: z.string().min(1),
  // Any amount_vnd sent by client is intentionally accepted in schema but ignored (BR-POC-01, BR-PAY-06)
  amount_vnd: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const db = getDb();

  // Verify user is not pending verification
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user_id))
    .limit(1);

  if (!userRecord) {
    throw new UnauthenticatedError();
  }

  assertUnrestrictedUser(userRecord.status);

  const customEvent = event as unknown as {
    _body?: unknown;
    context?: { body?: unknown };
  };
  const rawBody =
    (await readBody(event).catch(() => undefined)) ??
    customEvent._body ??
    customEvent.context?.body;
  const parsed = createOrderSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const { package_code, offer_code } = parsed.data;

  // Validate package in catalog
  const pkg = PACKAGE_CATALOG[package_code];
  if (!pkg) {
    throw new PackageNotFoundError();
  }

  if (!pkg.is_public || pkg.status !== "active") {
    throw new PackageNotSellableError();
  }

  const offer = pkg.offers.find((o) => o.offer_code === offer_code);
  if (!offer) {
    throw new OfferNotFoundError();
  }

  // Check for existing pending/submitted order for the same package (BR-POC-04)
  const [existingOrder] = await db
    .select()
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.userId, userRecord.id),
        eq(paymentOrders.packageCode, package_code),
        inArray(paymentOrders.status, [
          "draft",
          "pending",
          "pending_proof",
          "submitted",
          "under_review",
        ])
      )
    )
    .limit(1);

  if (existingOrder) {
    throw new OrderAlreadyPendingError({
      existing_order_uuid: existingOrder.uuid,
      package_code,
    });
  }

  // Generate unique order UUID and formatted transfer note
  const orderUuid = crypto.randomUUID();
  const transferNote = formatTransferNote(orderUuid);
  const expiresAt = computeOrderPendingExpiresAt();
  const amountVnd = offer.price_vnd;

  const [insertedOrder] = await db
    .insert(paymentOrders)
    .values({
      uuid: orderUuid,
      userId: userRecord.id,
      packageCode: pkg.code,
      offerCode: offer.offer_code,
      amountVnd,
      currency: "VND",
      status: "pending",
      transferNote,
      expiresAt,
    })
    .returning();

  if (!insertedOrder) {
    throw new InternalError("Tạo đơn hàng thất bại");
  }

  const vietQr = generateVietQrPayload({
    amountVnd,
    transferNote,
  });

  setResponseStatus(event, 201);
  return {
    uuid: insertedOrder.uuid,
    package_code: insertedOrder.packageCode,
    offer_code: insertedOrder.offerCode,
    amount_vnd: insertedOrder.amountVnd,
    currency: insertedOrder.currency,
    status: insertedOrder.status,
    transfer_note: insertedOrder.transferNote,
    qr_payload: vietQr.qrPayload,
    qr_image_url: vietQr.qrImageUrl,
    bank_info: vietQr.bankInfo,
    expires_at: insertedOrder.expiresAt,
    created_at: insertedOrder.createdAt,
  };
});
