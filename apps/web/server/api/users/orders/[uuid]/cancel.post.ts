import { appError } from "@mindkid/auth";
import { getDb, paymentOrders } from "@mindkid/db";
import {
  assertPaymentOrderTransition,
  type PaymentOrderStatus,
} from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

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

  const currentStatus = order.status as PaymentOrderStatus;
  if (
    currentStatus !== "pending" &&
    (currentStatus as string) !== "pending_proof"
  ) {
    throw appError("ORDER_CANNOT_BE_CANCELLED", {
      status: currentStatus,
      reason: "Chỉ có thể huỷ đơn hàng ở trạng thái chờ thanh toán.",
    });
  }

  assertPaymentOrderTransition(
    currentStatus === "pending_proof" ? "pending" : currentStatus,
    "cancelled"
  );

  const [updatedOrder] = await db
    .update(paymentOrders)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(paymentOrders.id, order.id))
    .returning();

  if (!updatedOrder) {
    throw createError({
      statusCode: 500,
      statusMessage: "ORDER_CANCEL_FAILED",
      message: "Huỷ đơn hàng thất bại",
    });
  }

  return {
    uuid: updatedOrder.uuid,
    status: updatedOrder.status,
  };
});
