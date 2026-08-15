export type NotificationKind = "transactional" | "periodic" | "operational";

export interface NotificationTypeMeta {
  code: string;
  kind: NotificationKind;
  optOutAllowed: boolean;
  recipientType: "user" | "manager";
}

export const NOTIFICATION_TYPES = {
  email_verification: {
    code: "email_verification",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  password_reset: {
    code: "password_reset",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  order_submitted: {
    code: "order_submitted",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  order_approved: {
    code: "order_approved",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  order_rejected: {
    code: "order_rejected",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  subscription_expiring: {
    code: "subscription_expiring",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  subscription_expired: {
    code: "subscription_expired",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  weekly_progress: {
    code: "weekly_progress",
    kind: "periodic",
    optOutAllowed: true,
    recipientType: "user",
  },
  content_new: {
    code: "content_new",
    kind: "periodic",
    optOutAllowed: true,
    recipientType: "user",
  },
  admin_order_pending: {
    code: "admin_order_pending",
    kind: "operational",
    optOutAllowed: false,
    recipientType: "manager",
  },
  admin_alert: {
    code: "admin_alert",
    kind: "operational",
    optOutAllowed: false,
    recipientType: "manager",
  },
  lesson_plan_source_updated: {
    code: "lesson_plan_source_updated",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  pdf_export_ready: {
    code: "pdf_export_ready",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
  pdf_export_failed: {
    code: "pdf_export_failed",
    kind: "transactional",
    optOutAllowed: false,
    recipientType: "user",
  },
} as const satisfies Record<string, NotificationTypeMeta>;

export type NotificationCode = keyof typeof NOTIFICATION_TYPES;

export const OPTIONAL_NOTIFICATION_CODES = Object.values(NOTIFICATION_TYPES)
  .filter((n) => n.optOutAllowed)
  .map((n) => n.code as NotificationCode);

/**
 * Validates user notification preferences update (BR-NOT-01).
 * Transactional & operational notifications CANNOT be opted out.
 */
export function validateNotificationPreferencesUpdate(
  payload: Record<string, unknown>
): { weekly_progress?: boolean; content_new?: boolean } {
  const allowedKeys = new Set(OPTIONAL_NOTIFICATION_CODES);
  const result: { weekly_progress?: boolean; content_new?: boolean } = {};

  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key as NotificationCode)) {
      throw new Error(
        `BR-NOT-01 violation: Cannot update preference for non-opt-outable notification '${key}'`
      );
    }
    const val = payload[key];
    if (typeof val !== "boolean") {
      throw new Error(`Invalid boolean preference value for '${key}'`);
    }
    if (key === "weekly_progress") {
      result.weekly_progress = val;
    }
    if (key === "content_new") {
      result.content_new = val;
    }
  }

  return result;
}
