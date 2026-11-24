import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { claimManagerOrder } from "#server/services/order-review-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw new ValidationError("Order UUID is required");
  }

  return await claimManagerOrder(orderUuid, session.manager_id);
});
