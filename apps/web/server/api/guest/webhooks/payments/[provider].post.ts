import { appError } from "@mindkid/auth";
import { requireFirstEnv } from "@mindkid/config";
import {
  AUTOMATED_PAYMENT_PROVIDERS,
  type AutomatedPaymentProvider,
  AutomatedPaymentWebhookPayloadSchema,
  verifyPaymentWebhookSignature,
} from "@mindkid/shared";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { processAutomatedPaymentWebhook } from "#server/services/index.js";

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

  const secretKey = requireFirstEnv([
    `PAYMENT_${provider.toUpperCase()}_WEBHOOK_SECRET`,
    "PAYMENT_WEBHOOK_SECRET",
  ]);

  // BR-APM-01: xác minh vô điều kiện. Bọc bước này trong `if (signature)` là
  // fail-open — người gọi chỉ cần **bỏ** header chữ ký là qua được cửa, và
  // `processAutomatedPaymentWebhook` sẽ duyệt một đơn chưa trả tiền.
  // `requireFirstEnv` đã ném nếu thiếu bí mật, nên `secretKey` luôn có giá trị.
  const isSignatureValid = verifyPaymentWebhookSignature(
    rawBodyString,
    signature,
    secretKey
  );

  if (!isSignatureValid) {
    throw appError(
      "WEBHOOK_SIGNATURE_INVALID",
      "Chữ ký số webhook không hợp lệ (BR-APM-01)"
    );
  }

  const parseResult = AutomatedPaymentWebhookPayloadSchema.safeParse(rawBody);

  if (!parseResult.success) {
    // `INVALID_WEBHOOK_PAYLOAD` chưa đăng ký trong error-codes.md, nên chưa
    // dùng được; `VALIDATION_FAILED` là mã 422 đã có.
    throw appError(
      "VALIDATION_FAILED",
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
