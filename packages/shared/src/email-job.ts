import { type EmailAdapter, LocalFileEmailAdapter } from "./email-sender.js";
import { NOTIFICATION_TYPES, type NotificationCode } from "./notifications.js";

export interface ProcessEmailJobInput {
  notificationId: number;
  to: string;
  code: string;
  payload: Record<string, unknown>;
  recipientStatus?: "active" | "deleted";
  userOptOut?: boolean;
  isBouncing?: boolean;
  adapter?: EmailAdapter;
}

export interface ProcessEmailJobResult {
  status: "dispatched" | "suppressed" | "failed";
  providerMessageId?: string;
  suppressedReason?: string;
}

/**
 * Tracks executed job IDs to enforce idempotency in tests / memory (BR-NOT-05).
 */
const executedJobIds = new Set<string>();

export function clearExecutedJobIds(): void {
  executedJobIds.clear();
}

/**
 * Processes email:send job (Task 4 / BR-NOT-01..07).
 */
export async function runSendEmail(
  jobId: string,
  input: ProcessEmailJobInput
): Promise<ProcessEmailJobResult> {
  // BR-NOT-05: Idempotency check
  if (executedJobIds.has(jobId)) {
    return {
      status: "suppressed",
      suppressedReason: "ALREADY_EXECUTED_JOB",
    };
  }

  const meta = NOTIFICATION_TYPES[input.code as NotificationCode];

  // Hard bounce rule: periodic emails suppressed if address is bouncing
  if (input.isBouncing && meta?.kind === "periodic") {
    executedJobIds.add(jobId);
    return {
      status: "suppressed",
      suppressedReason: "BOUNCING_ADDRESS",
    };
  }

  // Opt-out rule: periodic emails suppressed if user opted out
  if (input.userOptOut && meta?.optOutAllowed) {
    executedJobIds.add(jobId);
    return {
      status: "suppressed",
      suppressedReason: "USER_OPT_OUT",
    };
  }

  const emailAdapter = input.adapter ?? new LocalFileEmailAdapter();
  const dispatchRes = await emailAdapter.sendEmail({
    to: input.to,
    code: input.code as NotificationCode,
    payload: input.payload,
    recipientStatus: input.recipientStatus,
  });

  executedJobIds.add(jobId);

  if (!dispatchRes.sent) {
    return {
      status: "suppressed",
      suppressedReason: dispatchRes.suppressedReason ?? "UNKNOWN_SUPPRESSION",
    };
  }

  return {
    status: "dispatched",
    providerMessageId: dispatchRes.providerMessageId,
  };
}
