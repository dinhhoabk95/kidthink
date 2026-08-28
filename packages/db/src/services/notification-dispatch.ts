import { enqueue } from "@mindkid/queue";
import { and, eq } from "drizzle-orm";
import { getDb } from "#src/client";
import { notificationDeliveries, notifications } from "#src/schema/ops";

export interface TransactionalEmailInput {
  recipientType: "user" | "manager";
  recipientId: number;
  /** Mã trong `NOTIFICATION_TYPES` — xem `notification-service.md` §7.1. */
  code: string;
  to: string;
  payload: Record<string, unknown>;
}

/**
 * Đường duy nhất để một route đẩy email giao dịch.
 *
 * Trước Task này bốn route tự gọi `enqueue("email:send", {to, template, data})`
 * — hình dạng không khớp trường nào consumer đọc, và không chứa khoá idempotency
 * nên cả bốn dùng chung jobId `email:send:default`, khiến BullMQ khử trùng tất
 * cả trừ cái đầu tiên. `notificationId` vừa là khoá idempotency (`BR-JOB-02`,
 * `job-queue.md` §7.1) vừa là bản ghi lịch sử (`notification-service.md` §7.2).
 */
export async function dispatchTransactionalEmail(
  input: TransactionalEmailInput
): Promise<{ notificationId: number }> {
  const db = getDb();

  const [notification] = await db
    .insert(notifications)
    .values({
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      templateCode: input.code,
      payload: input.payload,
    })
    .returning();

  if (!notification) {
    throw new Error(
      `Không tạo được bản ghi notification cho mã '${input.code}'.`
    );
  }

  // §7.3 — một hàng mỗi channel, `queued` cho tới khi worker gửi xong.
  await db.insert(notificationDeliveries).values({
    notificationId: notification.id,
    channel: "email",
    status: "queued",
  });

  await enqueue("email:send", {
    notificationId: notification.id,
    to: input.to,
    code: input.code,
    payload: input.payload,
  });

  return { notificationId: notification.id };
}

export interface EmailDeliveryOutcome {
  status: "dispatched" | "suppressed" | "failed";
  providerMessageId?: string;
  suppressedReason?: string;
  error?: string;
}

/**
 * `BR-JOB-01` — consumer phải idempotent thật.
 *
 * Bản cũ khử trùng bằng một `Set<string>` trong bộ nhớ tiến trình
 * (`packages/shared/src/email-job.ts`), thứ reset mỗi lần worker khởi động lại
 * và không chia sẻ giữa các tiến trình. Trạng thái `notification_deliveries`
 * (`notification-service.md` §7.3) là chỗ bền để hỏi "đã gửi chưa".
 */
export async function isEmailAlreadyDispatched(
  notificationId: number
): Promise<boolean> {
  const [delivery] = await getDb()
    .select({ status: notificationDeliveries.status })
    .from(notificationDeliveries)
    .where(
      and(
        eq(notificationDeliveries.notificationId, notificationId),
        eq(notificationDeliveries.channel, "email")
      )
    );

  return delivery?.status === "dispatched";
}

export async function recordEmailDeliveryOutcome(
  notificationId: number,
  outcome: EmailDeliveryOutcome
): Promise<void> {
  await getDb()
    .update(notificationDeliveries)
    .set({
      status: outcome.status,
      providerMessageId: outcome.providerMessageId,
      suppressedReason: outcome.suppressedReason,
      error: outcome.error,
      dispatchedAt: outcome.status === "dispatched" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notificationDeliveries.notificationId, notificationId),
        eq(notificationDeliveries.channel, "email")
      )
    );
}
