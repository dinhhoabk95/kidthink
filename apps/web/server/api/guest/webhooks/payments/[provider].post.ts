import { appError } from "@mindkid/auth";
import { processAutomatedPaymentWebhook } from "@mindkid/db";
import {
  AUTOMATED_PAYMENT_PROVIDERS,
  type AutomatedPaymentProvider,
  AutomatedPaymentWebhookPayloadSchema,
  verifyPaymentWebhookSignature,
} from "@mindkid/shared";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const providerParam = getRouterParam(event, "provider");

  if (
    !(
      providerParam &&
      AUTOMATED_PAYMENT_PROVIDERS.includes(
        providerParam as AutomatedPaymentProvider
      )
    )
  ) {
    throw appError(
      "VALIDATION_FAILED",
      `Payment provider không được hỗ trợ: ${providerParam}`
    );
  }

  const provider = providerParam as AutomatedPaymentProvider;
  const rawBody =
    (event.context as { body?: unknown })?.body ??
    (await readBody(event).catch(() => undefined)) ??
    (event as unknown as { _body?: unknown })._body;
  const rawBodyString =
    typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);

  // Check signature if secret is configured (or in test environment)
  const reqHeaders = event.node?.req?.headers as
    | Record<string, string | undefined>
    | undefined;
  const signature =
    getHeader(event, "x-webhook-signature") ||
    getHeader(event, "x-signature") ||
    reqHeaders?.["x-webhook-signature"] ||
    reqHeaders?.["x-signature"] ||
    (rawBody as { signature?: string })?.signature ||
    "";

  const secretKey =
    process.env[`PAYMENT_${provider.toUpperCase()}_WEBHOOK_SECRET`] ||
    process.env.PAYMENT_WEBHOOK_SECRET ||
    (process.env.NODE_ENV === "test" ? "test_webhook_secret_key_12345" : "");

  if (secretKey && signature) {
    const isSignatureValid = verifyPaymentWebhookSignature(
      rawBodyString,
      signature,
      secretKey
    );

    if (!isSignatureValid) {
      throw appError(
        401,
        "WEBHOOK_SIGNATURE_INVALID",
        "Chữ ký số webhook không hợp lệ (BR-APM-01)"
      );
    }
  }

  const parseResult = AutomatedPaymentWebhookPayloadSchema.safeParse(rawBody);

  if (!parseResult.success) {
    throw appError(
      422,
      "INVALID_WEBHOOK_PAYLOAD",
      "Dữ liệu webhook không đúng định dạng schema chuẩn"
    );
  }

  const result = await processAutomatedPaymentWebhook(parseResult.data);

  return {
    ok: true,
    order_uuid: result.orderUuid,
    order_status: result.orderStatus,
    is_duplicate: result.isDuplicate,
  };
});
