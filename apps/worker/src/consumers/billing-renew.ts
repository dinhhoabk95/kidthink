import { logJobDone } from "#src/log";
import { runRecurringBillingRenewSweep } from "#src/services/payment-jobs";
import type { Consumer } from "./types.js";

export const billingRenew: Consumer<"billing:renew"> = async (
  _payload,
  ctx
) => {
  const result = await runRecurringBillingRenewSweep();
  logJobDone("billing:renew", ctx, {
    renewed: result.renewedCount,
    pastDue: result.pastDueCount,
  });
};
