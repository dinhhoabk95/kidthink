/**
 * Gói dịch vụ, đơn hàng, quota và webhook thanh toán — ERROR-CODES §7.3.
 *
 * Mỗi mã là một lớp. Lớp không khai `status` thì nhận 400 từ base.
 * ❌ NEVER thêm mã mới ở đây mà không đăng ký vào bảng §7 của
 * `docs/specs/00-foundation/error-codes.md` (`BR-ERR-01`).
 */

import { defineError } from "../base.ts";
import { defineModelNotFound } from "../model.ts";

export const PackageNotFoundError = defineError({
  code: "PACKAGE_NOT_FOUND",
  message: "Không tìm thấy gói dịch vụ.",
  status: 404,
});

export const PackageNotSellableError = defineError({
  code: "PACKAGE_NOT_SELLABLE",
  message: "Gói dịch vụ hiện không mở bán.",
});

export const OfferNotFoundError = defineError({
  code: "OFFER_NOT_FOUND",
  message: "Không tìm thấy gói ưu đãi tương ứng.",
});

export const OrderAlreadyPendingError = defineError({
  code: "ORDER_ALREADY_PENDING",
  message: "Bạn đã có đơn hàng chưa xử lý cho gói này.",
  status: 409,
});

export const OrderAlreadyProcessedError = defineError({
  code: "ORDER_ALREADY_PROCESSED",
  message: "Đơn hàng đã được xử lý trước đó.",
  status: 409,
});

export const OrderCannotBeCancelledError = defineError({
  code: "ORDER_CANNOT_BE_CANCELLED",
  message: "Chỉ có thể huỷ đơn hàng ở trạng thái chờ thanh toán.",
  status: 409,
});

export const PaymentProofRequiredError = defineError({
  code: "PAYMENT_PROOF_REQUIRED",
  message: "Vui lòng nhập mã giao dịch để nộp chứng từ.",
  status: 422,
});

export const QuotaExceededError = defineError<{ readonly resets_at: string }>({
  code: "QUOTA_EXCEEDED",
  message: "Bạn đã dùng hết hạn mức của gói dịch vụ.",
  status: 402,
});

export const InsufficientCreditsError = defineError({
  code: "INSUFFICIENT_CREDITS",
  message: "Số dư AI credit không đủ.",
  status: 402,
});

export const EntitlementRequiredError = defineError<{
  readonly required_entitlement: string;
}>({
  code: "ENTITLEMENT_REQUIRED",
  message: "Tính năng này thuộc gói dịch vụ bổ sung.",
  status: 403,
});

export const TierLockedError = defineError<{
  readonly access_tier: string;
  readonly required_entitlement?: string;
}>({
  code: "TIER_LOCKED",
  message: "Nội dung này thuộc gói cao hơn.",
  status: 403,
});

export const UnknownEntitlementKeyError = defineError({
  code: "UNKNOWN_ENTITLEMENT_KEY",
  message: "Khóa quyền lợi không hợp lệ.",
  status: 500,
});

export const WebhookSignatureInvalidError = defineError({
  code: "WEBHOOK_SIGNATURE_INVALID",
  message: "Chữ ký số webhook không hợp lệ.",
  status: 401,
});

export const WebhookReplayDetectedError = defineError({
  code: "WEBHOOK_REPLAY_DETECTED",
  message: "Yêu cầu webhook quá hạn hoặc phát lại.",
  status: 409,
});

export const ReconciliationMismatchError = defineError({
  code: "RECONCILIATION_MISMATCH",
  message: "Phát hiện sai lệch đối soát thanh toán.",
  status: 409,
});

export const SubscriptionAlreadyCancelledError = defineError({
  code: "SUBSCRIPTION_ALREADY_CANCELLED",
  message: "Gói thuê bao định kỳ đã được huỷ tự gia hạn.",
  status: 409,
});

export const RefundExceedsCapturedAmountError = defineError({
  code: "REFUND_EXCEEDS_CAPTURED_AMOUNT",
  message: "Số tiền hoàn vượt quá số tiền thực thu của đơn hàng.",
  status: 422,
});

export const RefundAlreadyProcessedError = defineError({
  code: "REFUND_ALREADY_PROCESSED",
  message: "Lệnh hoàn tiền đã được xử lý trước đó.",
  status: 409,
});

export const OrderNotFoundError = defineModelNotFound(
  "OrderNotFoundError",
  "payment_orders",
  "Không tìm thấy đơn hàng."
);

export const SubscriptionNotFoundError = defineModelNotFound(
  "SubscriptionNotFoundError",
  "subscriptions",
  "Không tìm thấy gói thuê bao định kỳ."
);

export const EntitlementNotFoundError = defineModelNotFound(
  "EntitlementNotFoundError",
  "user_entitlements",
  "Không tìm thấy quyền cần thu hồi."
);
