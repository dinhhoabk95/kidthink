import { logJobDone } from "#src/log";
import { runExpirePaymentOrders } from "../services/payment-jobs.js";
import type { Consumer } from "./types.js";

export const orderExpire: Consumer<"order:expire"> = async (_payload, ctx) => {
  const result = await runExpirePaymentOrders();
  logJobDone("order:expire", ctx, { expired: result.expiredCount });
};
