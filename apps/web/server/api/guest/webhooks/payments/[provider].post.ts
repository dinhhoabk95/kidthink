import { optionalEnv, requireEnv, requireFirstEnv } from "@mindkid/config";
import { WebhookSignatureInvalidError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import {
  AUTOMATED_PAYMENT_PROVIDERS,
  type AutomatedPaymentProvider,
  isPaymentWebhookOriginTrusted,
  PAYMENT_OPERATING_MODES,
  type PaymentOperatingMode,
  parsePaymentWebhookBody,
  verifyPaymentWebhookSignature,
} from "@mindkid/shared";
import { defineEventHandler, getHeader, getRouterParam, readRawBody } from "h3";
import { processAutomatedPaymentWebhook } from "#server/services/index.js";

function isOperatingMode(value: string): value is PaymentOperatingMode {
  return PAYMENT_OPERATING_MODES.some((mode) => mode === value);
}

function isSupportedProvider(
  value: string | undefined
): value is AutomatedPaymentProvider {
  return AUTOMATED_PAYMENT_PROVIDERS.some((provider) => provider === value);
}

/** Cảnh báo bảo mật có cấu trúc (UC-079 A1.2). Không ghi chữ ký hay thân thư. */
function warnRejected(provider: AutomatedPaymentProvider, reason: string) {
  console.warn(
    JSON.stringify({
      event: "payment_webhook.rejected",
      provider,
      reason,
    })
  );
}

export default defineEventHandler(async (event) => {
  const providerParam = getRouterParam(event, "provider");

  if (!isSupportedProvider(providerParam)) {
    throw new ValidationError(
      `Payment provider không được hỗ trợ: ${providerParam}`
    );
  }

  const provider = providerParam;
  const envKey = provider.toUpperCase();

  // BR-001: chữ ký tính trên BYTE THÔ của thân request, không phải JSON đã
  // parse rồi tuần tự hoá lại. Chữ ký chỉ lấy từ header; chữ ký nằm trong thân
  // không được chấp nhận.
  const rawBody = await readRawBody(event, "utf8");
  const signature =
    getHeader(event, "x-webhook-signature") ||
    getHeader(event, "x-signature") ||
    "";

  const secretKey = requireFirstEnv([
    `PAYMENT_${envKey}_WEBHOOK_SECRET`,
    "PAYMENT_WEBHOOK_SECRET",
  ]);

  // Xác minh vô điều kiện: thân thiếu, chữ ký thiếu hay sai đều từ chối.
  // Bọc bước này trong `if (signature)` là fail-open.
  if (
    !(rawBody && verifyPaymentWebhookSignature(rawBody, signature, secretKey))
  ) {
    warnRejected(provider, "signature_invalid");
    throw new WebhookSignatureInvalidError(
      "Chữ ký số webhook không hợp lệ (BR-001);"
    );
  }

  // Chỉ đọc nội dung sau khi chữ ký đã khớp.
  const parsed = parsePaymentWebhookBody(rawBody);

  if (!parsed.ok) {
    throw new ValidationError(
      "Dữ liệu webhook không đúng định dạng schema chuẩn"
    );
  }

  const payload = parsed.payload;
  const configuredMode = requireEnv("PAYMENT_MODE");
  const merchantId =
    optionalEnv(`PAYMENT_${envKey}_MERCHANT_ID`) ??
    requireEnv("PAYMENT_MERCHANT_ID");

  if (
    payload.provider !== provider ||
    !isOperatingMode(configuredMode) ||
    !isPaymentWebhookOriginTrusted(payload, {
      merchantId,
      mode: configuredMode,
    })
  ) {
    // Cùng mã lỗi với sai chữ ký để không lộ cấu hình cho người gọi.
    warnRejected(provider, "origin_mismatch");
    throw new WebhookSignatureInvalidError(
      "Tín hiệu webhook sai đơn vị nhận tiền hoặc chế độ vận hành (BR-001);"
    );
  }

  const result = await processAutomatedPaymentWebhook(payload);

  return {
    ok: true,
    order_uuid: result.orderUuid,
    order_status: result.orderStatus,
    is_duplicate: result.isDuplicate,
  };
});
