import { getDb, notificationDeliveries, notifications } from "@mindkid/db";
import { alert, enqueue } from "@mindkid/queue";
import { and, eq } from "drizzle-orm";

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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

  // Hai hàng này là một sự việc: một notification luôn có hàng delivery của nó.
  // Không gói transaction thì một lỗi giữa chừng để lại notification mồ côi
  // không ai gửi và không ai quét.
  const notificationId = await db.transaction(async (tx) => {
    const [notification] = await tx
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
    await tx.insert(notificationDeliveries).values({
      notificationId: notification.id,
      channel: "email",
      status: "queued",
    });

    return notification.id;
  });

  // Hàng đợi nằm ngoài transaction vì nó là hệ thống khác — commit rồi mới đẩy.
  // Nhưng `enableOfflineQueue: false` khiến `enqueue` từ chối ngay khi Valkey
  // không với tới được, và trước sửa đổi này hàng delivery ở lại `queued` vĩnh
  // viễn: Cấm — NEVER có gì quét lại hàng `queued`, nên email xác nhận đổi mật
  // khẩu mất hẳn, im lặng, trong khi route trả 500 cho người đã đổi xong.
  try {
    await enqueue("email:send", {
      notificationId,
      to: input.to,
      code: input.code,
      payload: input.payload,
    });
  } catch (error: unknown) {
    const message = readErrorMessage(error);

    await recordEmailDeliveryOutcome(notificationId, {
      status: "failed",
      error: message,
    });
    await alert("error", "Không đẩy được email giao dịch vào hàng đợi", {
      notificationId,
      code: input.code,
      error: message,
    });

    throw error;
  }

  return { notificationId };
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
