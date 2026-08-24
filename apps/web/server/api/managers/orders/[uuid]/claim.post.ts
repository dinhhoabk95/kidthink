import { appError } from "@mindkid/auth";
import { getDb, paymentOrders } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw appError("VALIDATION_FAILED", "Order UUID is required");
  }

  const db = getDb();
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.uuid, orderUuid))
    .limit(1);

  if (!order) {
    throw appError("NOT_FOUND");
  }

  let warning: string | undefined;
  if (
    order.status === "under_review" &&
    order.reviewedByManagerId &&
    order.reviewedByManagerId !== session.manager_id
  ) {
    warning = "Đơn hàng đang được xem xét bởi quản trị viên khác.";
  }

  let updatedStatus = order.status;
  if (order.status === "submitted") {
    const [updated] = await db
      .update(paymentOrders)
      .set({
        status: "under_review",
        reviewedByManagerId: session.manager_id,
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, order.id))
      .returning();
    updatedStatus = updated.status;
  }

  return {
    uuid: order.uuid,
    status: updatedStatus,
    reviewed_by_manager_id: session.manager_id,
    warning,
  };
});
