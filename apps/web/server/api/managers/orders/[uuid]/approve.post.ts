import { appError } from "@kidthink/auth";
import { MAX_BONUS_DAYS, MIN_ADMIN_NOTE_LENGTH } from "@kidthink/config";
import {
  auditLogs,
  entitlements,
  getDb,
  grantCredits,
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
import type { PgTransaction } from "drizzle-orm/pg-core";
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
  duration_days: z.number().optional(),
});

async function fetchAndLockOrder(
  // biome-ignore lint/suspicious/noExplicitAny: generic drizzle transaction
  tx: PgTransaction<any, any, any>,
  orderUuid: string
) {
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
      reason: "Đơn hàng đã được xử lý hoặc không ở trạng thái có thể duyệt.",
    });
  }

  assertPaymentOrderTransition(currentStatus, "approved");
  return order;
}

async function grantEntitlementsForOrder(
  // biome-ignore lint/suspicious/noExplicitAny: generic drizzle transaction
  tx: PgTransaction<any, any, any>,
  orderUserId: number,
  orderUuid: string,
  managerId: number,
  packageCode: string,
  offerCode: string,
  bonusDays: number,
  adminNote: string,
  now: Date
): Promise<Array<{ key: string; expires_at: Date | null }>> {
  const pkg = PACKAGE_CATALOG[packageCode];
  const offer = pkg?.offers.find((o) => o.offer_code === offerCode);
  const offerDurationDays = offer ? offer.duration_days : 365;
  const entitlementKeys = pkg?.entitlements || [];

  const results: Array<{ key: string; expires_at: Date | null }> = [];
  for (const key of entitlementKeys) {
    const [existing] = await tx
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, orderUserId),
          eq(entitlements.entitlementKey, key)
        )
      )
      .limit(1);

    const newExpiresAt = computeStackedExpiryDate(
      existing?.expiresAt,
      offerDurationDays,
      bonusDays,
      now
    );

    if (existing) {
      await tx
        .update(entitlements)
        .set({
          status: "active",
          source: "package_order",
          sourceRef: orderUuid,
          expiresAt: newExpiresAt,
          grantedByManagerId: managerId,
          grantReason: adminNote,
          updatedAt: now,
        })
        .where(eq(entitlements.id, existing.id));
    } else {
      await tx.insert(entitlements).values({
        userId: orderUserId,
        entitlementKey: key,
        source: "package_order",
        sourceRef: orderUuid,
        status: "active",
        expiresAt: newExpiresAt,
        grantedByManagerId: managerId,
        grantReason: adminNote,
      });
    }

    results.push({
      key,
      expires_at: newExpiresAt,
    });
  }
  return results;
}

async function maybeGrantPackageCredits(
  // biome-ignore lint/suspicious/noExplicitAny: generic drizzle transaction
  tx: PgTransaction<any, any, any>,
  userId: number,
  orderUuid: string,
  packageCode: string
): Promise<void> {
  const pkg = PACKAGE_CATALOG[packageCode];
  if (pkg?.credits_grant && pkg.credits_grant > 0) {
    await grantCredits({
      userId,
      delta: pkg.credits_grant,
      reason: "purchase",
      refType: "payment_order",
      refId: orderUuid,
      idempotencyKey: `order-approve-credits-${orderUuid}`,
      notifyUser: false,
      tx,
    });
  }
}

async function executeOrderApproval(
  db: ReturnType<typeof getDb>,
  session: { manager_id: number },
  orderUuid: string,
  adminNote: string,
  checklist: Record<string, unknown>,
  bonusDays: number,
  ip: string | null,
  userAgent: string | null
) {
  const now = new Date();
  let orderUserId = 0;
  let grantedEntitlements: Array<{ key: string; expires_at: Date | null }> = [];

  await db.transaction(async (tx) => {
    const order = await fetchAndLockOrder(tx, orderUuid);
    const currentStatus = order.status as PaymentOrderStatus;
    orderUserId = order.userId;

    const structuredAdminNote = JSON.stringify({
      note: adminNote,
      checklist,
      bonus_days: bonusDays,
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

    grantedEntitlements = await grantEntitlementsForOrder(
      tx,
      order.userId,
      order.uuid,
      session.manager_id,
      order.packageCode,
      order.offerCode,
      bonusDays,
      adminNote,
      now
    );

    await maybeGrantPackageCredits(
      tx,
      order.userId,
      order.uuid,
      order.packageCode
    );

    await tx.insert(auditLogs).values({
      actorType: "manager",
      actorId: session.manager_id,
      action: "order_approved",
      entityType: "payment_order",
      entityId: order.uuid,
      beforeData: { status: currentStatus },
      afterData: {
        status: "approved",
        bonus_days: bonusDays,
        checklist,
      },
      reason: adminNote,
      ipAddress: ip,
      userAgent,
    });

    await tx.insert(notifications).values({
      recipientType: "user",
      recipientId: order.userId,
      templateCode: "order_approved",
      payload: {
        order_uuid: order.uuid,
        package_code: order.packageCode,
        offer_code: order.offerCode,
        bonus_days: bonusDays,
      },
    });
  });

  if (orderUserId > 0) {
    await invalidateUserEntitlementsCache(orderUserId);
  }

  return {
    status: "approved",
    entitlements: grantedEntitlements,
  };
}

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

    return await executeOrderApproval(
      db,
      session,
      orderUuid,
      admin_note,
      checklist,
      bonus_days,
      getManagerRemoteIp(event),
      getHeader(event, "user-agent") || null
    );
  } catch (error) {
    respondToManagerAuthError(event, error);
  }
});
