import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { cancelUserOrder } from "#server/services/order-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw new ValidationError("Order UUID is required");
  }

  return await cancelUserOrder(session.user_id, orderUuid);
});
