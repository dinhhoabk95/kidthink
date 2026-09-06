import { getDb, paymentOrders } from "@mindkid/db";
import { OrderCannotBeCancelledError } from "@mindkid/errors/billing";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
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
    throw new ValidationError("Order UUID is required");
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
    throw new NotFoundError();
  }

  const currentStatus = order.status as PaymentOrderStatus;
  if (
    currentStatus !== "pending" &&
    (currentStatus as string) !== "pending_proof"
  ) {
    throw new OrderCannotBeCancelledError({
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
    throw new InternalError("Huỷ đơn hàng thất bại");
  }

  return {
    uuid: updatedOrder.uuid,
    status: updatedOrder.status,
  };
});
