import { logJobDone } from "#src/log";
import { runRecurringRenewalReminderSweep } from "#src/services/payment-jobs";
import type { Consumer } from "./types.js";

export const billingRenewalReminder: Consumer<
  "billing:renewal-reminder"
> = async (_payload, ctx) => {
  const result = await runRecurringRenewalReminderSweep();
  logJobDone("billing:renewal-reminder", ctx, {
    reminded: result.remindedCount,
    skipped: result.skippedCount,
  });
};
