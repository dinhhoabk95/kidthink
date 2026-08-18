import { appError } from "@mindkid/auth";
import { getDb, paymentOrders } from "@mindkid/db";
import { generateVietQrPayload } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireWebUserSession } from "../../../../utils/auth-runtime.ts";

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw appError("VALIDATION_FAILED", "Order UUID is required");
  }

  const db = getDb();
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.uuid, orderUuid),
        eq(paymentOrders.userId, session.user_id)
      )
    )
    .limit(1);

  if (!order) {
    throw appError("NOT_FOUND");
  }

  const vietQr =
    order.status === "pending" || (order.status as string) === "pending_proof"
      ? generateVietQrPayload({
          amountVnd: order.amountVnd,
          transferNote: order.transferNote || "",
        })
      : null;

  // Polite rejection message without leaking internal admin notes (BR-PPU-07, §7.3)
  let userRejectionReason: string | undefined;
  if (order.status === "rejected") {
    userRejectionReason =
      "Thông tin chứng từ hoặc mã giao dịch chưa khớp với sao kê ngân hàng. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.";
  }

  return {
    uuid: order.uuid,
    package_code: order.packageCode,
    offer_code: order.offerCode,
    amount_vnd: order.amountVnd,
    currency: order.currency,
    status: order.status,
    transfer_note: order.transferNote,
    bank_txn_ref: order.bankTxnRef,
    has_proof: Boolean(order.proofPath),
    submitted_at: order.submittedAt,
    reviewed_at: order.reviewedAt,
    expires_at: order.expiresAt,
    created_at: order.createdAt,
    rejection_reason: userRejectionReason,
    qr_payload: vietQr?.qrPayload,
    qr_image_url: vietQr?.qrImageUrl,
    bank_info: vietQr?.bankInfo,
  };
});
