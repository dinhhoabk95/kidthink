export const AUDIT_ACTIONS = {
  // Auth
  MANAGER_LOGIN: "manager_login",
  MANAGER_LOGIN_FAILED: "manager_login_failed",
  MANAGER_MFA_FAILED: "manager_mfa_failed",

  // User
  USER_SUSPENDED: "user_suspended",
  USER_REACTIVATED: "user_reactivated",
  USER_DELETED: "user_deleted",

  // Entitlement / Quota
  ENTITLEMENT_GRANTED: "entitlement_granted",
  ENTITLEMENT_REVOKED: "entitlement_revoked",
  QUOTA_RESET: "quota_reset",

  // Billing / Orders
  ORDER_APPROVED: "order_approved",
  ORDER_REJECTED: "order_rejected",
  BONUS_DAYS_GRANTED: "bonus_days_granted",

  // Content
  CONTENT_CREATED: "content_created",
  CONTENT_SUBMITTED: "content_submitted",
  CONTENT_APPROVED: "content_approved",
  CONTENT_REJECTED: "content_rejected",
  CONTENT_PUBLISHED: "content_published",
  CONTENT_ARCHIVED: "content_archived",
  CONTENT_ROLLED_BACK: "content_rolled_back",
  CONTENT_DELETED: "content_deleted",

  // Asset
  IMAGE_UPLOADED: "image_uploaded",
  IMAGE_DELETED: "image_deleted",

  // Config
  FEATURE_FLAG_CHANGED: "feature_flag_changed",
  PACKAGE_CATALOG_DEPLOYED: "package_catalog_deployed",

  // Data
  DATA_EXPORTED: "data_exported",
  CONSENT_WITHDRAWN: "consent_withdrawn",

  // Child
  CHILD_PROFILE_ARCHIVED: "child_profile_archived",
  CHILD_DATA_PURGED: "child_data_purged",

  // Offline pack / PWA
  PWA_OFFLINE_PACK_MANIFEST_GENERATED: "pwa.offline_pack.manifest_generated",
  PWA_OFFLINE_PACK_SYNCED: "pwa.offline_pack.synced",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const ACTIONS_REQUIRING_REASON = [
  "user_suspended",
  "user_reactivated",
  "user_deleted",
  "entitlement_granted",
  "entitlement_revoked",
  "quota_reset",
  "order_approved",
  "order_rejected",
  "bonus_days_granted",
  "content_rejected",
  "content_rolled_back",
  "content_deleted",
  "image_deleted",
  "feature_flag_changed",
  "data_exported",
] as const satisfies readonly AuditAction[];

export type AuditActionWithReason = (typeof ACTIONS_REQUIRING_REASON)[number];
export type AuditActionWithoutReason = Exclude<
  AuditAction,
  AuditActionWithReason
>;

export type AuditInput<A extends AuditAction = AuditAction> = {
  actor_type: "user" | "manager" | "system";
  actor_id?: number | null;
  action: A;
  entity_type: string;
  entity_id: string;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
} & (A extends AuditActionWithReason
  ? { reason: string }
  : { reason?: string | null });
