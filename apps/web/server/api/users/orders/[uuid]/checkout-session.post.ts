import { getAppDb, paymentOrders } from "@mindkid/db";
import {
  OfferNotFoundError,
  OrderAlreadyProcessedError,
  OrderNotFoundError,
  PackageNotFoundError,
  PackageNotSellableError,
} from "@mindkid/errors/billing";
import {
  AUTOMATED_PAYMENT_PROVIDERS,
  formatTransferNote,
  generateVietQrPayload,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { getRouterParam } from "h3";
import { z } from "zod";
import { throwValidationError } from "#server/utils/api-error";
import { defineApiRoute } from "#server/utils/define-api-route";

const orderParamSchema = z.object({
  uuid: z.string().uuid(),
});

const checkoutSessionSchema = z.object({
  provider: z.enum(AUTOMATED_PAYMENT_PROVIDERS).default("payos"),
  return_url: z.string().url().optional(),
  // Accepted in schema so client payload does not fail validation, but always ignored (BR-APM-03)
  amount_vnd: z.number().optional(),
});

export default defineApiRoute({
  auth: "user",
  body: checkoutSessionSchema,
  handler: async ({ event, auth, body }) => {
    const rawUuid =
      getRouterParam(event, "uuid") || event.context?.params?.uuid;
    const paramParsed = orderParamSchema.safeParse({ uuid: rawUuid });
    if (!paramParsed.success) {
      throwValidationError(paramParsed.error);
    }
    const orderUuid = paramParsed.data.uuid;

    const db = getAppDb();
    const [order] = await db
      .select()
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.uuid, orderUuid),
          eq(paymentOrders.userId, auth.user_id)
        )
      )
      .limit(1);

    if (!order) {
      throw new OrderNotFoundError(orderUuid);
    }

    const currentStatus: string = order.status;
    if (
      currentStatus !== "pending" &&
      currentStatus !== "draft" &&
      currentStatus !== "pending_proof"
    ) {
      throw new OrderAlreadyProcessedError();
    }

    const pkg = PACKAGE_CATALOG[order.packageCode];
    if (!pkg) {
      throw new PackageNotFoundError();
    }
    if (!pkg.is_public || pkg.status !== "active") {
      throw new PackageNotSellableError();
    }

    const offer = pkg.offers.find((o) => o.offer_code === order.offerCode);
    if (!offer) {
      throw new OfferNotFoundError();
    }

    // BR-APM-03: Price is strictly determined by server-side PACKAGE_CATALOG
    const catalogAmountVnd = offer.price_vnd;
    const transferNote = order.transferNote || formatTransferNote(order.uuid);
    const vietQr = generateVietQrPayload({
      amountVnd: catalogAmountVnd,
      transferNote,
    });

    const provider = body.provider ?? "payos";
    const checkoutUrl = `https://checkout.${provider}.vn/pay/${order.uuid}?amount=${catalogAmountVnd}`;

    return {
      order_uuid: order.uuid,
      provider,
      amount_vnd: catalogAmountVnd,
      currency: order.currency,
      transfer_note: transferNote,
      checkout_url: checkoutUrl,
      qr_payload: vietQr.qrPayload,
      qr_image_url: vietQr.qrImageUrl,
      bank_info: vietQr.bankInfo,
      expires_at: order.expiresAt,
    };
  },
});
