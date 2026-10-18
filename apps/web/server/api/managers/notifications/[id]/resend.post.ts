import { writeAudit } from "@mindkid/audit";
import {
  getOwnerDb,
  managers,
  notificationDeliveries,
  notifications,
  users,
} from "@mindkid/db";
import {
  NotificationNotFoundError,
  UserAlreadyDeletedError,
} from "@mindkid/errors/account";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { InternalError, ValidationError } from "@mindkid/errors/common";
import { enqueue } from "@mindkid/queue";
import { NOTIFICATION_TYPES, type NotificationCode } from "@mindkid/shared";
import { desc, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { getUserNotificationPreferences } from "#server/utils/notification-preferences-runtime";

const MAX_RESEND_ATTEMPTS = 3;

type ResendPayloadValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | readonly number[];

type ResendPayloadRecord = Record<string, ResendPayloadValue>;

function isSocketOfflineError(err: Error | string): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("ECONNREFUSED") ||
    msg.includes("EPERM") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("Connection is closed") ||
    msg.includes("Stream isn't writeable")
  );
}

function parseResendPayload(
  raw: (typeof notifications.$inferSelect)["payload"]
): {
  rawPayload: ResendPayloadRecord;
  currentAttempt: number;
} {
  const rawPayload: ResendPayloadRecord =
    raw && typeof raw === "object" ? { ...(raw as ResendPayloadRecord) } : {};
  const currentAttempt =
    typeof rawPayload.resend_attempt === "number"
      ? rawPayload.resend_attempt
      : 0;
  if (currentAttempt >= MAX_RESEND_ATTEMPTS) {
    throw new ValidationError(
      `Thông báo này đã đạt giới hạn gửi lại tối đa (${MAX_RESEND_ATTEMPTS} lần) (BR-NTA-02)`
    );
  }
  return { rawPayload, currentAttempt };
}

async function resolveResendRecipientEmail(
  db: ReturnType<typeof getOwnerDb>,
  recipientType: string,
  recipientId: number
): Promise<string> {
  if (recipientType === "user") {
    const [user] = await db
      .select({ id: users.id, email: users.email, status: users.status })
      .from(users)
      .where(eq(users.id, recipientId));

    if (!user || user.status === "deleted") {
      throw new UserAlreadyDeletedError(
        "Người nhận đã bị vô hiệu hoá hoặc xoá tài khoản"
      );
    }
    return user.email;
  }

  if (recipientType === "manager") {
    const [mgr] = await db
      .select({
        id: managers.id,
        email: managers.email,
        isActive: managers.isActive,
      })
      .from(managers)
      .where(eq(managers.id, recipientId));

    if (!mgr?.isActive) {
      throw new UserAlreadyDeletedError(
        "Tài khoản quản trị nhận thông báo đã ngừng hoạt động"
      );
    }
    return mgr.email;
  }

  return "";
}

function assertResendAllowed(
  templateCode: string,
  recipientType: string,
  recipientId: number,
  suppressedReason: string | null | undefined
): void {
  const meta =
    templateCode in NOTIFICATION_TYPES
      ? NOTIFICATION_TYPES[templateCode as NotificationCode]
      : undefined;

  if (meta?.optOutAllowed && recipientType === "user") {
    const prefs = getUserNotificationPreferences(recipientId);
    const isOptedOutInPrefs =
      (templateCode === "weekly_progress" && !prefs.weekly_progress) ||
      (templateCode === "content_new" && !prefs.content_new);
    if (isOptedOutInPrefs || suppressedReason === "USER_OPT_OUT") {
      throw new ValidationError(
        "Người nhận đã tắt nhận thông báo không bắt buộc này (BR-NTA-07)"
      );
    }
  }

  if (suppressedReason === "BOUNCING_ADDRESS" && meta?.kind === "periodic") {
    throw new ValidationError(
      "Địa chỉ email đang bị đánh dấu lỗi cứng, không thể gửi lại thông báo định kỳ (D-KR)"
    );
  }
}

async function enqueueResendSafely(
  notificationId: number,
  recipientEmail: string,
  templateCode: string,
  payload: ResendPayloadRecord
): Promise<void> {
  if (!recipientEmail) {
    return;
  }
  try {
    await enqueue("email:send", {
      notificationId,
      to: recipientEmail,
      code: templateCode,
      payload,
    });
  } catch (err) {
    const normalizedErr = err instanceof Error ? err : String(err);
    if (!isSocketOfflineError(normalizedErr)) {
      throw err;
    }
  }
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền gửi lại thông báo (BR-NTA-05)"
    );
  }

  const id = Number(getRouterParam(event, "id"));
  if (!id || id <= 0) {
    throw new NotificationNotFoundError("NOTIFICATION_NOT_FOUND");
  }

  const db = getOwnerDb();
  const [original] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!original) {
    throw new NotificationNotFoundError("NOTIFICATION_NOT_FOUND");
  }

  if (original.templateCode.startsWith("child_")) {
    throw new ValidationError(
      "Hệ thống nghiêm cấm gửi thông báo trực tiếp tới trẻ em (BR-NTA-06)"
    );
  }

  const { rawPayload, currentAttempt } = parseResendPayload(original.payload);
  const recipientEmail = await resolveResendRecipientEmail(
    db,
    original.recipientType,
    original.recipientId
  );

  const [latestDelivery] = await db
    .select({
      status: notificationDeliveries.status,
      suppressedReason: notificationDeliveries.suppressedReason,
    })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.notificationId, original.id))
    .orderBy(desc(notificationDeliveries.id))
    .limit(1);

  assertResendAllowed(
    original.templateCode,
    original.recipientType,
    original.recipientId,
    latestDelivery?.suppressedReason
  );

  const nextAttempt = currentAttempt + 1;
  const nextPayload: ResendPayloadRecord = {
    ...rawPayload,
    resent_from_notification_id: original.id,
    resend_attempt: nextAttempt,
  };

  // BR-NTA-01: Create NEW row, NEVER mutate old row
  const [newNotification] = await db
    .insert(notifications)
    .values({
      recipientType: original.recipientType,
      recipientId: original.recipientId,
      templateCode: original.templateCode,
      payload: nextPayload,
    })
    .returning();

  if (!newNotification) {
    throw new InternalError("Tạo bản ghi thông báo mới thất bại");
  }

  await db.insert(notificationDeliveries).values({
    notificationId: newNotification.id,
    channel: "email",
    status: "queued",
  });

  await enqueueResendSafely(
    newNotification.id,
    recipientEmail,
    original.templateCode,
    nextPayload
  );

  const managerId = manager.manager_id;
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      reason: "Gửi lại thông báo giao dịch theo yêu cầu quản trị viên",
      entity_type: "notification",
      entity_id: newNotification.id.toString(),
      after_data: {
        original_notification_id: id,
        new_notification_id: newNotification.id,
        template_code: original.templateCode,
        resend_attempt: nextAttempt,
      },
    });
  });

  return {
    success: true,
    original_notification_id: id,
    new_notification_id: newNotification.id,
    resend_attempt: nextAttempt,
  };
});
