import { runExpirePaymentOrders } from "@mindkid/db";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export const orderExpire: Consumer<"order:expire"> = async (_payload, ctx) => {
  const result = await runExpirePaymentOrders();
  logJobDone("order:expire", ctx, { expired: result.expiredCount });
};
