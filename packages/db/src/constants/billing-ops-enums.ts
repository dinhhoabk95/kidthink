import { createIntEnumCodec } from "#src/constants/enum-codec";

export const ENTITLEMENT_GROUP = {
  CONTENT: 1,
  ACCOUNT: 2,
  REPORT: 3,
  CREATOR: 4,
  AI: 5,
} as const;
export type EntitlementGroup =
  (typeof ENTITLEMENT_GROUP)[keyof typeof ENTITLEMENT_GROUP];
export type EntitlementGroupLabel =
  | "content"
  | "account"
  | "report"
  | "creator"
  | "ai";
export const ENTITLEMENT_GROUP_VALUES = [1, 2, 3, 4, 5] as const;
export const ENTITLEMENT_GROUP_CODEC = createIntEnumCodec<
  EntitlementGroup,
  EntitlementGroupLabel
>([
  [ENTITLEMENT_GROUP.CONTENT, "content"],
  [ENTITLEMENT_GROUP.ACCOUNT, "account"],
  [ENTITLEMENT_GROUP.REPORT, "report"],
  [ENTITLEMENT_GROUP.CREATOR, "creator"],
  [ENTITLEMENT_GROUP.AI, "ai"],
]);

export const PACKAGE_STATUS = {
  ACTIVE: 1,
  RETIRED: 2,
} as const;
export type PackageStatus =
  (typeof PACKAGE_STATUS)[keyof typeof PACKAGE_STATUS];
export type PackageStatusLabel = "active" | "retired";
export const PACKAGE_STATUS_VALUES = [1, 2] as const;
export const PACKAGE_STATUS_CODEC = createIntEnumCodec<
  PackageStatus,
  PackageStatusLabel
>([
  [PACKAGE_STATUS.ACTIVE, "active"],
  [PACKAGE_STATUS.RETIRED, "retired"],
]);

export const ENTITLEMENT_SOURCE = {
  PACKAGE_ORDER: 1,
  MANUAL_GRANT: 2,
  TRIAL: 3,
  PROMO: 4,
} as const;
export type EntitlementSource =
  (typeof ENTITLEMENT_SOURCE)[keyof typeof ENTITLEMENT_SOURCE];
export type EntitlementSourceLabel =
  | "package_order"
  | "manual_grant"
  | "trial"
  | "promo";
export const ENTITLEMENT_SOURCE_VALUES = [1, 2, 3, 4] as const;
export const ENTITLEMENT_SOURCE_CODEC = createIntEnumCodec<
  EntitlementSource,
  EntitlementSourceLabel
>([
  [ENTITLEMENT_SOURCE.PACKAGE_ORDER, "package_order"],
  [ENTITLEMENT_SOURCE.MANUAL_GRANT, "manual_grant"],
  [ENTITLEMENT_SOURCE.TRIAL, "trial"],
  [ENTITLEMENT_SOURCE.PROMO, "promo"],
]);

export const ENTITLEMENT_STATUS = {
  PENDING: 1,
  SOFT_UNLOCK: 2,
  ACTIVE: 3,
  GRACE_PERIOD: 4,
  EXPIRED: 5,
  CANCELLED: 6,
} as const;
export type EntitlementStatus =
  (typeof ENTITLEMENT_STATUS)[keyof typeof ENTITLEMENT_STATUS];
export type EntitlementStatusLabel =
  | "pending"
  | "soft_unlock"
  | "active"
  | "grace_period"
  | "expired"
  | "cancelled";
export const ENTITLEMENT_STATUS_VALUES = [1, 2, 3, 4, 5, 6] as const;
export const ENTITLEMENT_STATUS_CODEC = createIntEnumCodec<
  EntitlementStatus,
  EntitlementStatusLabel
>([
  [ENTITLEMENT_STATUS.PENDING, "pending"],
  [ENTITLEMENT_STATUS.SOFT_UNLOCK, "soft_unlock"],
  [ENTITLEMENT_STATUS.ACTIVE, "active"],
  [ENTITLEMENT_STATUS.GRACE_PERIOD, "grace_period"],
  [ENTITLEMENT_STATUS.EXPIRED, "expired"],
  [ENTITLEMENT_STATUS.CANCELLED, "cancelled"],
]);

export const PAYMENT_ORDER_STATUS = {
  DRAFT: 1,
  PENDING: 2,
  PENDING_PROOF: 3,
  SUBMITTED: 4,
  UNDER_REVIEW: 5,
  APPROVED: 6,
  REJECTED: 7,
  EXPIRED: 8,
  CANCELLED: 9,
} as const;
export type PaymentOrderStatus =
  (typeof PAYMENT_ORDER_STATUS)[keyof typeof PAYMENT_ORDER_STATUS];
export type PaymentOrderStatusLabel =
  | "draft"
  | "pending"
  | "pending_proof"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";
export const PAYMENT_ORDER_STATUS_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const PAYMENT_ORDER_STATUS_CODEC = createIntEnumCodec<
  PaymentOrderStatus,
  PaymentOrderStatusLabel
>([
  [PAYMENT_ORDER_STATUS.DRAFT, "draft"],
  [PAYMENT_ORDER_STATUS.PENDING, "pending"],
  [PAYMENT_ORDER_STATUS.PENDING_PROOF, "pending_proof"],
  [PAYMENT_ORDER_STATUS.SUBMITTED, "submitted"],
  [PAYMENT_ORDER_STATUS.UNDER_REVIEW, "under_review"],
  [PAYMENT_ORDER_STATUS.APPROVED, "approved"],
  [PAYMENT_ORDER_STATUS.REJECTED, "rejected"],
  [PAYMENT_ORDER_STATUS.EXPIRED, "expired"],
  [PAYMENT_ORDER_STATUS.CANCELLED, "cancelled"],
]);

export const RECURRING_SUBSCRIPTION_STATUS = {
  ACTIVE: 1,
  PAST_DUE: 2,
  CANCELLED: 3,
  EXPIRED: 4,
} as const;
export type RecurringSubscriptionStatus =
  (typeof RECURRING_SUBSCRIPTION_STATUS)[keyof typeof RECURRING_SUBSCRIPTION_STATUS];
export type RecurringSubscriptionStatusLabel =
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";
export const RECURRING_SUBSCRIPTION_STATUS_VALUES = [1, 2, 3, 4] as const;
export const RECURRING_SUBSCRIPTION_STATUS_CODEC = createIntEnumCodec<
  RecurringSubscriptionStatus,
  RecurringSubscriptionStatusLabel
>([
  [RECURRING_SUBSCRIPTION_STATUS.ACTIVE, "active"],
  [RECURRING_SUBSCRIPTION_STATUS.PAST_DUE, "past_due"],
  [RECURRING_SUBSCRIPTION_STATUS.CANCELLED, "cancelled"],
  [RECURRING_SUBSCRIPTION_STATUS.EXPIRED, "expired"],
]);

export const AI_CREDIT_REASON = {
  PURCHASE: 1,
  USAGE: 2,
  MANUAL_GRANT: 3,
  REFUND: 4,
} as const;
export type AiCreditReason =
  (typeof AI_CREDIT_REASON)[keyof typeof AI_CREDIT_REASON];
export type AiCreditReasonLabel =
  | "purchase"
  | "usage"
  | "manual_grant"
  | "refund";
export const AI_CREDIT_REASON_VALUES = [1, 2, 3, 4] as const;
export const AI_CREDIT_REASON_CODEC = createIntEnumCodec<
  AiCreditReason,
  AiCreditReasonLabel
>([
  [AI_CREDIT_REASON.PURCHASE, "purchase"],
  [AI_CREDIT_REASON.USAGE, "usage"],
  [AI_CREDIT_REASON.MANUAL_GRANT, "manual_grant"],
  [AI_CREDIT_REASON.REFUND, "refund"],
]);

export const ACTOR_TYPE = {
  USER: 1,
  MANAGER: 2,
  SYSTEM: 3,
} as const;
export type ActorType = (typeof ACTOR_TYPE)[keyof typeof ACTOR_TYPE];
export type ActorTypeLabel = "user" | "manager" | "system";
export const ACTOR_TYPE_VALUES = [1, 2, 3] as const;
export const ACTOR_TYPE_CODEC = createIntEnumCodec<ActorType, ActorTypeLabel>([
  [ACTOR_TYPE.USER, "user"],
  [ACTOR_TYPE.MANAGER, "manager"],
  [ACTOR_TYPE.SYSTEM, "system"],
]);

export const RECIPIENT_TYPE = {
  USER: 1,
  MANAGER: 2,
} as const;
export type RecipientType =
  (typeof RECIPIENT_TYPE)[keyof typeof RECIPIENT_TYPE];
export type RecipientTypeLabel = "user" | "manager";
export const RECIPIENT_TYPE_VALUES = [1, 2] as const;
export const RECIPIENT_TYPE_CODEC = createIntEnumCodec<
  RecipientType,
  RecipientTypeLabel
>([
  [RECIPIENT_TYPE.USER, "user"],
  [RECIPIENT_TYPE.MANAGER, "manager"],
]);

export const NOTIFICATION_CHANNEL = {
  EMAIL: 1,
  IN_APP: 2,
  FCM_WEB: 3,
} as const;
export type NotificationChannel =
  (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];
export type NotificationChannelLabel = "email" | "in_app" | "fcm_web";
export const NOTIFICATION_CHANNEL_VALUES = [1, 2, 3] as const;
export const NOTIFICATION_CHANNEL_CODEC = createIntEnumCodec<
  NotificationChannel,
  NotificationChannelLabel
>([
  [NOTIFICATION_CHANNEL.EMAIL, "email"],
  [NOTIFICATION_CHANNEL.IN_APP, "in_app"],
  [NOTIFICATION_CHANNEL.FCM_WEB, "fcm_web"],
]);

export const NOTIFICATION_ENDPOINT_PROVIDER = {
  FCM_WEB: 1,
} as const;
export type NotificationEndpointProvider =
  (typeof NOTIFICATION_ENDPOINT_PROVIDER)[keyof typeof NOTIFICATION_ENDPOINT_PROVIDER];
export type NotificationEndpointProviderLabel = "fcm_web";
export const NOTIFICATION_ENDPOINT_PROVIDER_VALUES = [1] as const;
export const NOTIFICATION_ENDPOINT_PROVIDER_CODEC = createIntEnumCodec<
  NotificationEndpointProvider,
  NotificationEndpointProviderLabel
>([[NOTIFICATION_ENDPOINT_PROVIDER.FCM_WEB, "fcm_web"]]);

export const NOTIFICATION_ENDPOINT_STATUS = {
  ACTIVE: 1,
  INVALID: 2,
  REVOKED: 3,
} as const;
export type NotificationEndpointStatus =
  (typeof NOTIFICATION_ENDPOINT_STATUS)[keyof typeof NOTIFICATION_ENDPOINT_STATUS];
export type NotificationEndpointStatusLabel = "active" | "invalid" | "revoked";
export const NOTIFICATION_ENDPOINT_STATUS_VALUES = [1, 2, 3] as const;
export const NOTIFICATION_ENDPOINT_STATUS_CODEC = createIntEnumCodec<
  NotificationEndpointStatus,
  NotificationEndpointStatusLabel
>([
  [NOTIFICATION_ENDPOINT_STATUS.ACTIVE, "active"],
  [NOTIFICATION_ENDPOINT_STATUS.INVALID, "invalid"],
  [NOTIFICATION_ENDPOINT_STATUS.REVOKED, "revoked"],
]);

export const NOTIFICATION_STATUS = {
  QUEUED: 1,
  DISPATCHED: 2,
  FAILED: 3,
  SUPPRESSED: 4,
} as const;
export type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];
export type NotificationStatusLabel =
  | "queued"
  | "dispatched"
  | "failed"
  | "suppressed";
export const NOTIFICATION_STATUS_VALUES = [1, 2, 3, 4] as const;
export const NOTIFICATION_STATUS_CODEC = createIntEnumCodec<
  NotificationStatus,
  NotificationStatusLabel
>([
  [NOTIFICATION_STATUS.QUEUED, "queued"],
  [NOTIFICATION_STATUS.DISPATCHED, "dispatched"],
  [NOTIFICATION_STATUS.FAILED, "failed"],
  [NOTIFICATION_STATUS.SUPPRESSED, "suppressed"],
]);
