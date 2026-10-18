import { logJobDone } from "#src/log";
import { runRecurringDunningSweep } from "#src/services/payment-jobs";
import type { Consumer } from "./types.js";

export const billingDunningSweep: Consumer<"billing:dunning-sweep"> = async (
  _payload,
  ctx
) => {
  const result = await runRecurringDunningSweep();
  logJobDone("billing:dunning-sweep", ctx, {
    processed: result.totalProcessed,
    retried: result.retriedCount,
    expired: result.expiredCount,
  });
};
