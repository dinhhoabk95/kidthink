import { writeAudit } from "@mindkid/audit";
import {
  isUniqueConstraintError,
  type JsonRecord,
  NOTIFICATION_CHANNEL_CODEC,
  NOTIFICATION_ENDPOINT_PROVIDER,
  NOTIFICATION_ENDPOINT_STATUS_CODEC,
  NOTIFICATION_STATUS_CODEC,
  type NotificationChannel,
  type NotificationStatus,
  RECIPIENT_TYPE,
  RECIPIENT_TYPE_CODEC,
  USER_STATUS,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import {
  NotificationNotFoundError,
  UserAlreadyDeletedError,
} from "@mindkid/errors/account";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import {
  type EmailTemplateCode,
  encryptFcmToken,
  getNotificationTemplateState,
  publishNotificationTemplate,
  saveNotificationTemplateDraft,
  TEMPLATE_REGISTRY,
} from "@mindkid/notification";
import { enqueue } from "@mindkid/queue";
import { NOTIFICATION_TYPES, type NotificationCode } from "@mindkid/shared";
import { z } from "zod";
import { getUserNotificationPreferences } from "#server/utils/notification-preferences-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

const NotificationPayloadSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  action_url: z.string().optional(),
});

type NotificationPayloadScalar = string | number | boolean | null | undefined;
export type NotificationPayloadObject = Record<
  string,
  NotificationPayloadScalar | readonly NotificationPayloadScalar[]
>;

const SENSITIVE_KEY_PATTERN =
  /(^|_)(otp|code|token|secret|password|pin|hash|reset_url|verify_url)($|_)/i;
const SENSITIVE_URL_QUERY_PATTERN =
  /([?&](?:token|access_token|refresh_token|code|otp|secret|pin|password|key|signature)=)[^&#\s]+/gi;
const MAX_NOTIFICATION_ENDPOINTS_PER_USER = 20;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RESEND_ATTEMPTS = 3;
const SCRIPT_TAG_REGEX = /<script/i;
const EXTERNAL_IMG_REGEX = /<img[^>]+src=["']http/i;

const VALID_DELIVERY_STATUSES: readonly string[] = [
  "queued",
  "dispatched",
  "failed",
  "suppressed",
];

const VALID_DELIVERY_CHANNELS: readonly string[] = [
  "email",
  "in_app",
  "fcm_web",
];

type ResendPayloadValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | readonly number[];

type ResendPayloadRecord = Record<string, ResendPayloadValue>;

function parseDeliveryStatus(val: string): NotificationStatus | undefined {
  return VALID_DELIVERY_STATUSES.some((s) => s === val)
    ? NOTIFICATION_STATUS_CODEC.toCode(
        val as "queued" | "dispatched" | "failed" | "suppressed"
      )
    : undefined;
}

function parseDeliveryChannel(val: string): NotificationChannel | undefined {
  return VALID_DELIVERY_CHANNELS.some((c) => c === val)
    ? NOTIFICATION_CHANNEL_CODEC.toCode(val as "email" | "in_app" | "fcm_web")
    : undefined;
}

function sanitizeActionUrl(
  url: string | number | boolean | null | undefined
): string {
  if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/me";
}

export async function getUserNotificationsInbox(
  userId: number,
  options: {
    readonly limit?: string | number;
    readonly unread_only?: string;
    readonly cursor?: string;
  }
) {
  const rawLimit = Number.parseInt(String(options.limit || "20"), 10);
  const limit = Math.min(
    Math.max(Number.isNaN(rawLimit) ? 20 : rawLimit, 1),
    50
  );
  const unreadOnly =
    options.unread_only === "true" || options.unread_only === "1";

  let cursorDate: Date | undefined;
  if (typeof options.cursor === "string") {
    const parsed = new Date(options.cursor);
    if (!Number.isNaN(parsed.getTime())) {
      cursorDate = parsed;
    }
  }

  const snapshotAt = new Date().toISOString();
  const snapshotDate = new Date(Date.now() + 60_000);

  const repos = useOwnerRepositories();
  const page = await repos.notifications.listUserInbox(userId, {
    unreadOnly,
    cursorDate,
    snapshotDate,
    limit,
  });

  return {
    items: page.items.map((item) => {
      const parsedPayload = NotificationPayloadSchema.safeParse(item.payload);
      const payload = parsedPayload.success ? parsedPayload.data : {};
      return {
        uuid: item.uuid,
        code: item.templateCode,
        title: payload.title || "Thông báo",
        body: payload.body || "",
        action_url: sanitizeActionUrl(payload.action_url),
        occurred_at: item.createdAt.toISOString(),
        read_at: item.read ? item.read.readAt.toISOString() : null,
      };
    }),
    next_cursor: page.nextCursor ? page.nextCursor.toISOString() : null,
    unread_count: page.unreadCount,
    snapshot_at: snapshotAt,
  };
}

export async function markUserNotificationRead(
  userId: number,
  notificationUuid: string
) {
  const repos = useOwnerRepositories();
  const notif = await repos.notifications.findByUuidForUser(
    notificationUuid,
    userId
  );

  if (!notif) {
    // BR-NIB-02: 404 for cross-user or missing notification to prevent IDOR
    throw new NotificationNotFoundError("Thông báo không tồn tại");
  }

  const readAt = await repos.notifications.markReadIfUnread(notif.id);

  return {
    uuid: notif.uuid,
    read_at: readAt.toISOString(),
  };
}

export async function markAllUserNotificationsRead(
  userId: number,
  snapshotAt: string
) {
  const repos = useOwnerRepositories();
  const snapshotDate = new Date(snapshotAt);
  const markedCount = await repos.notifications.markAllReadForUser(
    userId,
    snapshotDate
  );

  return {
    marked_count: markedCount,
    snapshot_at: snapshotAt,
  };
}

export async function registerUserNotificationEndpoint(
  userId: number,
  input: {
    readonly provider: "fcm_web";
    readonly clientInstallationId: string;
    readonly token: string;
  }
) {
  const { tokenEncrypted, tokenFingerprint } = encryptFcmToken(input.token);
  const repos = useOwnerRepositories();

  try {
    const endpoint = await repos.notifications.transaction(async (tx) => {
      const txRepos = createRepositories(tx);
      const beforeCount =
        await txRepos.notifications.countEndpointsByUser(userId);
      const upserted = await txRepos.notifications.upsertEndpoint({
        userId,
        provider: NOTIFICATION_ENDPOINT_PROVIDER.FCM_WEB,
        clientInstallationId: input.clientInstallationId,
        tokenEncrypted,
        tokenFingerprint,
      });
      const afterCount =
        await txRepos.notifications.countEndpointsByUser(userId);

      if (
        beforeCount >= MAX_NOTIFICATION_ENDPOINTS_PER_USER &&
        afterCount > beforeCount
      ) {
        throw new ValidationError(
          `Mỗi tài khoản chỉ được đăng ký tối đa ${MAX_NOTIFICATION_ENDPOINTS_PER_USER} thiết bị nhận thông báo.`
        );
      }

      return upserted;
    });

    // BR-BPS-04: Token is NEVER echoed back in response
    return {
      uuid: endpoint.uuid,
      provider: input.provider,
      status: NOTIFICATION_ENDPOINT_STATUS_CODEC.toLabel(endpoint.status),
    };
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    if (
      err instanceof Error &&
      isUniqueConstraintError(err, ["token_fingerprint"])
    ) {
      throw new ValidationError(
        "Token thông báo của thiết bị này đã được đăng ký trước đó."
      );
    }
    throw err;
  }
}

export async function revokeUserNotificationEndpoint(
  userId: number,
  endpointUuid: string
): Promise<void> {
  const repos = useOwnerRepositories();
  const revoked = await repos.notifications.revokeEndpointForUser(
    endpointUuid,
    userId
  );

  if (!revoked) {
    throw new NotFoundError("Endpoint không tồn tại");
  }
}

function redactEmail(email: string): string {
  const parts = email.split("@");
  const name = parts[0];
  const domain = parts[1];
  if (!(name && domain) || parts.length !== 2) {
    return email;
  }
  const firstChar = name.charAt(0) || "u";
  return `${firstChar}***@${domain}`;
}

/**
 * Strips raw OTP / token / secret fields from payload display (BR-NTA-04)
 */
export function sanitizeNotificationPayload(
  payload: NotificationPayloadObject | null,
  templateCode: string
): NotificationPayloadObject | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const clean: NotificationPayloadObject = { ...payload };

  for (const key of Object.keys(clean)) {
    if (
      key === "order_code" ||
      key === "orderCode" ||
      key === "entity_code" ||
      key === "package_code"
    ) {
      continue;
    }
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      clean[key] = "******";
      continue;
    }
    const lowerKey = key.toLowerCase();
    const val = clean[key];
    if (
      (lowerKey === "url" || lowerKey.endsWith("_url")) &&
      typeof val === "string"
    ) {
      clean[key] = val.replace(SENSITIVE_URL_QUERY_PATTERN, "$1******");
    }
  }

  if (
    (templateCode.includes("otp") || templateCode.includes("verify")) &&
    "password" in clean
  ) {
    clean.password = undefined;
  }

  return clean;
}

function parseIsoDateBoundary(
  value: string | undefined,
  operator: "gte" | "lte"
): Date | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const trimmed = value.trim();
  const isoStr =
    operator === "lte" && DATE_ONLY_REGEX.test(trimmed)
      ? `${trimmed}T23:59:59.999Z`
      : trimmed;
  const d = new Date(isoStr);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function listManagerNotifications(query: {
  readonly code?: string;
  readonly status?: string;
  readonly channel?: string;
  readonly recipient?: string;
  readonly from?: string;
  readonly to?: string;
  readonly limit?: string;
}) {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const trimmedStatus = query.status?.trim();
  const trimmedChannel = query.channel?.trim();

  const repos = useOwnerRepositories();
  const rows = await repos.notifications.listDeliveryHistoryForManager({
    templateCode: query.code?.trim() || undefined,
    status: trimmedStatus ? parseDeliveryStatus(trimmedStatus) : undefined,
    channel: trimmedChannel ? parseDeliveryChannel(trimmedChannel) : undefined,
    recipient: query.recipient?.trim() || undefined,
    from: parseIsoDateBoundary(query.from, "gte"),
    to: parseIsoDateBoundary(query.to, "lte"),
    limit,
  });

  const sanitizedRows = rows.map((r) => {
    const rawEmail =
      r.notification.recipientType === RECIPIENT_TYPE.USER
        ? (r.notification.userRecipient?.email ?? null)
        : null;
    return {
      id: r.id,
      uuid: r.uuid,
      notificationId: r.notificationId,
      channel: NOTIFICATION_CHANNEL_CODEC.toLabel(r.channel),
      status: NOTIFICATION_STATUS_CODEC.toLabel(r.status),
      suppressedReason: r.suppressedReason,
      providerMessageId: r.providerMessageId,
      dispatchedAt: r.dispatchedAt,
      error: r.error,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      templateCode: r.notification.templateCode,
      recipientType: RECIPIENT_TYPE_CODEC.toLabel(r.notification.recipientType),
      recipientId: r.notification.recipientId,
      recipientEmailMasked: rawEmail ? redactEmail(rawEmail) : null,
      payload: sanitizeNotificationPayload(
        r.notification.payload as NotificationPayloadObject | null,
        r.notification.templateCode
      ),
    };
  });

  return {
    items: sanitizedRows,
    total: sanitizedRows.length,
  };
}

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

function parseResendPayload(raw: JsonRecord | null): {
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

export async function resendManagerNotification(
  managerId: number,
  notificationId: number
) {
  const repos = useOwnerRepositories();
  const original = await repos.notifications.findById(notificationId);

  if (!original) {
    throw new NotificationNotFoundError("NOTIFICATION_NOT_FOUND");
  }

  if (original.templateCode.startsWith("child_")) {
    throw new ValidationError(
      "Hệ thống nghiêm cấm gửi thông báo trực tiếp tới trẻ em (BR-NTA-06)"
    );
  }

  const { rawPayload, currentAttempt } = parseResendPayload(original.payload);

  let recipientEmail = "";
  if (original.recipientType === RECIPIENT_TYPE.USER) {
    const user = await repos.users.findById(original.recipientId);
    if (!user || user.status === USER_STATUS.DELETED) {
      throw new UserAlreadyDeletedError(
        "Người nhận đã bị vô hiệu hoá hoặc xoá tài khoản"
      );
    }
    recipientEmail = user.email;
  } else if (original.recipientType === RECIPIENT_TYPE.MANAGER) {
    const mgr = await repos.managers.findById(original.recipientId);
    if (!mgr?.isActive) {
      throw new UserAlreadyDeletedError(
        "Tài khoản quản trị nhận thông báo đã ngừng hoạt động"
      );
    }
    recipientEmail = mgr.email;
  }

  const latestDelivery = await repos.notifications.findLatestDelivery(
    original.id
  );

  assertResendAllowed(
    original.templateCode,
    RECIPIENT_TYPE_CODEC.toLabel(original.recipientType),
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
  const { notification: newNotification } =
    await repos.notifications.createWithEmailDelivery({
      recipientType: original.recipientType,
      recipientId: original.recipientId,
      templateCode: original.templateCode,
      payload: nextPayload,
    });

  await enqueueResendSafely(
    newNotification.id,
    recipientEmail,
    original.templateCode,
    nextPayload
  );

  await repos.notifications.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      reason: "Gửi lại thông báo giao dịch theo yêu cầu quản trị viên",
      entity_type: "notification",
      entity_id: newNotification.id.toString(),
      after_data: {
        original_notification_id: notificationId,
        new_notification_id: newNotification.id,
        template_code: original.templateCode,
        resend_attempt: nextAttempt,
      },
    });
  });

  return {
    success: true,
    original_notification_id: notificationId,
    new_notification_id: newNotification.id,
    resend_attempt: nextAttempt,
  };
}

function validateTemplateSecurity(subject: string, content: string): void {
  if (SCRIPT_TAG_REGEX.test(subject) || SCRIPT_TAG_REGEX.test(content)) {
    throw new ValidationError(
      "Nội dung thông báo không được chứa thẻ script độc hại (D-KL)"
    );
  }
  if (EXTERNAL_IMG_REGEX.test(subject) || EXTERNAL_IMG_REGEX.test(content)) {
    throw new ValidationError(
      "Nội dung thông báo không được chứa hình ảnh theo dõi bên ngoài (D-KL)"
    );
  }
}

function validateRequiredVariables(
  code: EmailTemplateCode,
  subject: string,
  content: string,
  providedVars: string[]
): void {
  const tDef = TEMPLATE_REGISTRY[code];
  if (!tDef) {
    return;
  }
  const requiredVars = tDef.requiredVars;
  const combinedSource = `${subject}\n${content}`;
  const missingVars = requiredVars.filter(
    (v: string) =>
      !(
        providedVars.includes(v) ||
        combinedSource.includes(`{{${v}}}`) ||
        combinedSource.includes(`{{ ${v} }}`)
      )
  );

  if (missingVars.length > 0) {
    throw new ValidationError(
      `Mẫu thông báo thiếu các biến bắt buộc: ${missingVars.join(", ")} (BR-NTA-07)`
    );
  }
}

export async function patchManagerNotificationTemplate(input: {
  readonly managerId: number;
  readonly rawCode: string;
  readonly version: number;
  readonly subject?: string;
  readonly body?: string;
  readonly reason?: string;
  readonly providedVars: string[];
  readonly action: "save_draft" | "publish";
}) {
  if (input.rawCode.startsWith("child_")) {
    throw new ValidationError(
      "Hệ thống nghiêm cấm tạo hoặc gửi mẫu thông báo trực tiếp tới trẻ em (BR-NTA-06)"
    );
  }

  if (!(input.rawCode && input.rawCode in TEMPLATE_REGISTRY)) {
    throw new NotFoundError(
      `Không tìm thấy mẫu thông báo mã '${input.rawCode}'`
    );
  }

  const code = input.rawCode as EmailTemplateCode;
  const currentState = getNotificationTemplateState(code);

  const subject =
    input.subject === undefined ? currentState.subject : input.subject.trim();
  if (!subject) {
    throw new ValidationError("Tiêu đề mẫu thông báo không được để trống");
  }
  const content = input.body === undefined ? currentState.body : input.body;
  const reason = input.reason ? input.reason.trim() : "";

  validateTemplateSecurity(subject, content);
  validateRequiredVariables(code, subject, content, input.providedVars);

  const updatedState =
    input.action === "publish"
      ? publishNotificationTemplate({
          code,
          subject,
          body: content,
          updatedByManagerId: input.managerId,
          baseVersion: input.version,
        })
      : saveNotificationTemplateDraft({
          code,
          subject,
          body: content,
          updatedByManagerId: input.managerId,
          baseVersion: input.version,
        });

  const repos = useOwnerRepositories();
  await repos.auditLogs.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.managerId,
      action:
        input.action === "publish" ? "content_published" : "content_created",
      reason:
        reason ||
        (input.action === "publish"
          ? "Phê duyệt và phát hành mẫu thông báo"
          : "Cập nhật mẫu thông báo"),
      entity_type: "notification_template",
      entity_id: `${code}_v${updatedState.content_version}`,
      after_data: {
        code,
        version: updatedState.content_version,
        status: updatedState.status,
        subject: updatedState.subject,
      },
    });
  });

  return {
    template: updatedState,
    status: updatedState.status,
    message:
      updatedState.status === "published"
        ? "Mẫu thông báo đã được phê duyệt và phát hành chính thức (BR-NTA-03)"
        : "Mẫu thông báo đã được lưu dưới dạng bản nháp (draft) và đưa vào hàng đợi kiểm duyệt (BR-NTA-03)",
  };
}
