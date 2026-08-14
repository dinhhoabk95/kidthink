import { appError } from "@kidthink/auth";
import { MIN_ADMIN_NOTE_LENGTH } from "@kidthink/config";
import {
  auditLogs,
  entitlements,
  getDb,
  notifications,
  paymentOrders,
} from "@kidthink/db";
import {
  assertPaymentOrderTransition,
  type PaymentOrderStatus,
} from "@kidthink/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.ts";
import { invalidateUserEntitlementsCache } from "../../../../utils/entitlements-runtime.ts";

const rejectOrderSchema = z.object({
  admin_note: z
    .string({ required_error: "Ghi chú từ chối là bắt buộc." })
    .min(
      MIN_ADMIN_NOTE_LENGTH,
      `Ghi chú từ chối bắt buộc tối thiểu ${MIN_ADMIN_NOTE_LENGTH} ký tự (BR-PAP-04).`
    ),
});

export default defineEventHandler(async (event) => {
  try {
    const session = requireSuperAdminSession(event);
    const orderUuid = getRouterParam(event, "uuid");
    if (!orderUuid) {
      throw appError("VALIDATION_FAILED", "Order UUID is required");
    }

    const customEvent = event as unknown as {
      _body?: unknown;
      context?: { body?: unknown };
    };
    const rawBody =
      (await readBody(event).catch(() => undefined)) ??
      customEvent._body ??
      customEvent.context?.body;
    const parsed = rejectOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.admin_note) {
        throw appError("ADMIN_NOTE_REQUIRED", fieldErrors.admin_note[0]);
      }
      throw appError("VALIDATION_FAILED", {
        errors: fieldErrors,
      });
    }

    const { admin_note } = parsed.data;
    const db = getDb();
    const now = new Date();

    let orderUserId = 0;
    const revokedKeys: string[] = [];

    // Atomic transaction with row lock (D-JH, BR-PAP-02, BR-PAP-03)
    await db.transaction(async (tx) => {
      // Step 1 in transaction: SELECT ... FOR UPDATE (D-JH)
      const [order] = await tx
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.uuid, orderUuid))
        .for("update");

      if (!order) {
        throw appError("NOT_FOUND");
      }

      const currentStatus = order.status as PaymentOrderStatus;
      if (currentStatus !== "submitted" && currentStatus !== "under_review") {
        throw appError("ORDER_ALREADY_PROCESSED", {
          current_status: currentStatus,
          reason:
            "Đơn hàng đã được xử lý hoặc không ở trạng thái có thể từ chối.",
        });
      }

      assertPaymentOrderTransition(currentStatus, "rejected");
      orderUserId = order.userId;

      // Update payment order status to rejected
      await tx
        .update(paymentOrders)
        .set({
          status: "rejected",
          reviewedAt: now,
          reviewedByManagerId: session.manager_id,
          adminNote: admin_note,
          updatedAt: now,
        })
        .where(eq(paymentOrders.id, order.id));

      // Revoke soft_unlock entitlements associated with this order immediately (BR-PAY-04, BR-PAP-03)
      const revokedRows = await tx
        .update(entitlements)
        .set({
          status: "cancelled",
          updatedAt: now,
        })
        .where(
          and(
            eq(entitlements.userId, order.userId),
            eq(entitlements.sourceRef, order.uuid)
          )
        )
        .returning({ key: entitlements.entitlementKey });

      for (const r of revokedRows) {
        revokedKeys.push(r.key);
      }

      // Record audit log (BR-AUD-01)
      await tx.insert(auditLogs).values({
        actorType: "manager",
        actorId: session.manager_id,
        action: "order_rejected",
        entityType: "payment_order",
        entityId: order.uuid,
        beforeData: { status: currentStatus },
        afterData: {
          status: "rejected",
          revoked_entitlements_count: revokedKeys.length,
        },
        reason: admin_note,
        ipAddress: getManagerRemoteIp(event),
        userAgent: getHeader(event, "user-agent") || null,
      });

      // Enqueue notification for user
      await tx.insert(notifications).values({
        recipientType: "user",
        recipientId: order.userId,
        templateCode: "order_rejected",
        payload: {
          order_uuid: order.uuid,
          package_code: order.packageCode,
          offer_code: order.offerCode,
          polite_reason:
            "Thông tin chứng từ hoặc mã giao dịch chưa khớp với sao kê ngân hàng. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.",
        },
      });
    });

    // Invalidate user entitlements cache immediately in the same request (D-JI)
    if (orderUserId > 0) {
      await invalidateUserEntitlementsCache(orderUserId);
    }

    return {
      status: "rejected",
      revoked_entitlements: revokedKeys,
    };
  } catch (error) {
    respondToManagerAuthError(event, error);
  }
});
