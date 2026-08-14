import { appError } from "@kidthink/auth";
import { MAX_BONUS_DAYS, MIN_ADMIN_NOTE_LENGTH } from "@kidthink/config";
import {
  auditLogs,
  entitlements,
  getDb,
  notifications,
  paymentOrders,
} from "@kidthink/db";
import {
  assertPaymentOrderTransition,
  computeStackedExpiryDate,
  PACKAGE_CATALOG,
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

const approveOrderSchema = z.object({
  admin_note: z
    .string({ required_error: "Ghi chú duyệt là bắt buộc." })
    .min(
      MIN_ADMIN_NOTE_LENGTH,
      `Ghi chú duyệt bắt buộc tối thiểu ${MIN_ADMIN_NOTE_LENGTH} ký tự (BR-PAP-04).`
    ),
  checklist: z.object({
    amount_matches: z.literal(true, {
      errorMap: () => ({
        message: "Phải xác nhận số tiền trên chứng từ khớp với đơn.",
      }),
    }),
    transfer_note_present: z.literal(true, {
      errorMap: () => ({
        message: "Phải xác nhận nội dung chuyển khoản chứa mã đơn.",
      }),
    }),
    bank_ref_unused: z.literal(true, {
      errorMap: () => ({
        message: "Phải xác nhận mã giao dịch chưa được dùng cho đơn khác.",
      }),
    }),
    transfer_time_valid: z.literal(true, {
      errorMap: () => ({
        message: "Phải xác nhận thời gian chuyển khoản hợp lệ sau lúc tạo đơn.",
      }),
    }),
    proof_legible: z.literal(true, {
      errorMap: () => ({
        message: "Phải xác nhận ảnh chứng từ rõ ràng, không bị che khuất.",
      }),
    }),
  }),
  bonus_days: z
    .number()
    .int()
    .min(0)
    .max(
      MAX_BONUS_DAYS,
      `Cấp bù ngày tối đa ${MAX_BONUS_DAYS} ngày (BR-PAP-06).`
    )
    .optional()
    .default(0),
  // Any duration_days sent from form is intentionally ignored (BR-PAP-07)
  duration_days: z.number().optional(),
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
    const parsed = approveOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.admin_note) {
        throw appError("ADMIN_NOTE_REQUIRED", fieldErrors.admin_note[0]);
      }
      throw appError("VALIDATION_FAILED", {
        errors: fieldErrors,
      });
    }

    const { admin_note, checklist, bonus_days } = parsed.data;
    const db = getDb();
    const now = new Date();

    let orderUserId = 0;
    const grantedEntitlements: Array<{ key: string; expires_at: Date | null }> =
      [];

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
            "Đơn hàng đã được xử lý hoặc không ở trạng thái có thể duyệt.",
        });
      }

      assertPaymentOrderTransition(currentStatus, "approved");
      orderUserId = order.userId;

      // Update payment order status to approved
      const structuredAdminNote = JSON.stringify({
        note: admin_note,
        checklist,
        bonus_days,
      });

      await tx
        .update(paymentOrders)
        .set({
          status: "approved",
          reviewedAt: now,
          reviewedByManagerId: session.manager_id,
          adminNote: structuredAdminNote,
          updatedAt: now,
        })
        .where(eq(paymentOrders.id, order.id));

      // Resolve package duration from catalog snapshot (BR-PAP-07)
      const pkg = PACKAGE_CATALOG[order.packageCode];
      const offer = pkg?.offers.find((o) => o.offer_code === order.offerCode);
      const offerDurationDays = offer ? offer.duration_days : 365;

      const entitlementKeysToGrant = pkg?.entitlements || [];

      for (const key of entitlementKeysToGrant) {
        // Query existing entitlement to calculate stacking (BR-PAP-05)
        const [existing] = await tx
          .select()
          .from(entitlements)
          .where(
            and(
              eq(entitlements.userId, order.userId),
              eq(entitlements.entitlementKey, key)
            )
          )
          .limit(1);

        const newExpiresAt = computeStackedExpiryDate(
          existing?.expiresAt,
          offerDurationDays,
          bonus_days,
          now
        );

        if (existing) {
          await tx
            .update(entitlements)
            .set({
              status: "active",
              source: "package_order",
              sourceRef: order.uuid,
              expiresAt: newExpiresAt,
              grantedByManagerId: session.manager_id,
              grantReason: admin_note,
              updatedAt: now,
            })
            .where(eq(entitlements.id, existing.id));
        } else {
          await tx.insert(entitlements).values({
            userId: order.userId,
            entitlementKey: key,
            source: "package_order",
            sourceRef: order.uuid,
            status: "active",
            expiresAt: newExpiresAt,
            grantedByManagerId: session.manager_id,
            grantReason: admin_note,
          });
        }

        grantedEntitlements.push({
          key,
          expires_at: newExpiresAt,
        });
      }

      // Record audit log (BR-AUD-01)
      await tx.insert(auditLogs).values({
        actorType: "manager",
        actorId: session.manager_id,
        action: "order_approved",
        entityType: "payment_order",
        entityId: order.uuid,
        beforeData: { status: currentStatus },
        afterData: {
          status: "approved",
          bonus_days,
          checklist,
        },
        reason: admin_note,
        ipAddress: getManagerRemoteIp(event),
        userAgent: getHeader(event, "user-agent") || null,
      });

      // Enqueue notification for user
      await tx.insert(notifications).values({
        recipientType: "user",
        recipientId: order.userId,
        templateCode: "order_approved",
        payload: {
          order_uuid: order.uuid,
          package_code: order.packageCode,
          offer_code: order.offerCode,
          bonus_days,
        },
      });
    });

    // Invalidate user entitlements cache immediately (D-JI)
    if (orderUserId > 0) {
      await invalidateUserEntitlementsCache(orderUserId);
    }

    return {
      status: "approved",
      entitlements: grantedEntitlements,
    };
  } catch (error) {
    respondToManagerAuthError(event, error);
  }
});
