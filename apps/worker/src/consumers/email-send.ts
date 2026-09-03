import {
  isEmailAlreadyDispatched,
  recordEmailDeliveryOutcome,
} from "@mindkid/notification";
import { runSendEmail } from "@mindkid/shared";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

/**
 * `BR-JOB-01` — retry là hành vi bình thường của queue, nên consumer phải
 * idempotent bằng trạng thái bền, không phải bằng bộ nhớ tiến trình.
 */
export const emailSend: Consumer<"email:send"> = async (payload, ctx) => {
  if (await isEmailAlreadyDispatched(payload.notificationId)) {
    logJobDone("email:send", ctx, {
      notificationId: payload.notificationId,
      status: "already_dispatched",
    });
    return { status: "suppressed", suppressedReason: "ALREADY_DISPATCHED" };
  }

  try {
    const result = await runSendEmail(ctx.jobId, payload);

    await recordEmailDeliveryOutcome(payload.notificationId, {
      status: result.status === "dispatched" ? "dispatched" : "suppressed",
      providerMessageId: result.providerMessageId,
      suppressedReason: result.suppressedReason,
    });

    logJobDone("email:send", ctx, {
      notificationId: payload.notificationId,
      code: payload.code,
      status: result.status,
    });

    return result;
  } catch (error: unknown) {
    await recordEmailDeliveryOutcome(payload.notificationId, {
      status: "failed",
      error: readErrorMessage(error),
    });
    throw error;
  }
};
