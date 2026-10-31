import { logJobDone } from "#src/log";
import { runExpirePaymentOrders } from "#src/services/payment-jobs";
import type { Consumer } from "./types.js";

export const orderExpire: Consumer<"order:expire"> = async (_payload, ctx) => {
  const result = await runExpirePaymentOrders(new Date(), ctx.signal);
  logJobDone("order:expire", ctx, { expired: result.expiredCount });
};
