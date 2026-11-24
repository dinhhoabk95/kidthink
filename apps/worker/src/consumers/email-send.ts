import { isCloudflareRuntime } from "@mindkid/config";
import {
  BrevoHttpEmailDriver,
  isEmailAlreadyDispatched,
  recordEmailDeliveryOutcome,
} from "@mindkid/notification";
import { type ProcessEmailJobInput, runSendEmail } from "@mindkid/shared";
import { readErrorMessage } from "#src/errors";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

type EmailAdapter = NonNullable<ProcessEmailJobInput["adapter"]>;
type SendEmailInput = Parameters<EmailAdapter["sendEmail"]>[0];
type SendEmailResult = Awaited<ReturnType<EmailAdapter["sendEmail"]>>;

/**
 * Resolves the production/edge email adapter from environment configuration.
 * Fails closed in production or Cloudflare Workers if Brevo credentials are absent.
 */
export function resolveProductionEmailAdapter(): EmailAdapter | undefined {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.EMAIL_FROM_ADDRESS?.trim();
  const senderName = process.env.EMAIL_FROM_NAME?.trim() || undefined;

  if (apiKey && senderEmail) {
    const driver = new BrevoHttpEmailDriver({
      apiKey,
      senderEmail,
      ...(senderName ? { senderName } : {}),
    });

    return {
      async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
        if (typeof input.to !== "string" || !input.to.includes("@")) {
          throw new Error(
            "BR-NOT-02 violation: Email recipient must be a valid email address string (child profiles forbidden)"
          );
        }

        if (input.recipientStatus === "deleted") {
          return {
            sent: false,
            suppressedReason: "ACCOUNT_DELETED",
          };
        }

        const response = await driver.sendEmail({
          to: input.to,
          code: input.code,
          payload: input.payload,
        });

        if (!response.sent) {
          throw new Error(response.error ?? "Brevo HTTP email delivery failed");
        }

        return {
          sent: true,
          providerMessageId: response.providerMessageId,
        };
      },
    };
  }

  if (process.env.NODE_ENV === "production" || isCloudflareRuntime()) {
    throw new Error(
      "Missing Brevo HTTP email configuration (BREVO_API_KEY, EMAIL_FROM_ADDRESS) in production/Cloudflare runtime"
    );
  }

  return undefined;
}

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
    const adapter = resolveProductionEmailAdapter();
    const result = await runSendEmail(
      ctx.jobId,
      adapter ? { ...payload, adapter } : payload
    );

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
  } catch (error) {
    await recordEmailDeliveryOutcome(payload.notificationId, {
      status: "failed",
      error: readErrorMessage(error),
    });
    throw error;
  }
};
