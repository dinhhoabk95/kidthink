import { createIntEnumCodec } from "#src/constants/enum-codec";

export const USER_STATUS = {
  PENDING_VERIFICATION: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  DELETED: 4,
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
export type UserStatusLabel =
  | "pending_verification"
  | "active"
  | "suspended"
  | "deleted";
export const USER_STATUS_VALUES = [1, 2, 3, 4] as const;
export const USER_STATUS_CODEC = createIntEnumCodec<
  UserStatus,
  UserStatusLabel
>([
  [USER_STATUS.PENDING_VERIFICATION, "pending_verification"],
  [USER_STATUS.ACTIVE, "active"],
  [USER_STATUS.SUSPENDED, "suspended"],
  [USER_STATUS.DELETED, "deleted"],
]);

export const MANAGER_ROLE = {
  SUPER_ADMIN: 1,
  CONTENT_REVIEWER: 2,
} as const;
export type ManagerRole = (typeof MANAGER_ROLE)[keyof typeof MANAGER_ROLE];
export type ManagerRoleLabel = "super_admin" | "content_reviewer";
export const MANAGER_ROLE_VALUES = [1, 2] as const;
export const MANAGER_ROLE_CODEC = createIntEnumCodec<
  ManagerRole,
  ManagerRoleLabel
>([
  [MANAGER_ROLE.SUPER_ADMIN, "super_admin"],
  [MANAGER_ROLE.CONTENT_REVIEWER, "content_reviewer"],
]);

export const ACCOUNT_TYPE = {
  USER: 1,
  MANAGER: 2,
} as const;
export type AccountType = (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];
export type AccountTypeLabel = "user" | "manager";
export const ACCOUNT_TYPE_VALUES = [1, 2] as const;
export const ACCOUNT_TYPE_CODEC = createIntEnumCodec<
  AccountType,
  AccountTypeLabel
>([
  [ACCOUNT_TYPE.USER, "user"],
  [ACCOUNT_TYPE.MANAGER, "manager"],
]);

export const AUTH_METHOD = {
  PASSWORD: 1,
  SOCIAL: 2,
  PASSKEY: 3,
} as const;
export type AuthMethod = (typeof AUTH_METHOD)[keyof typeof AUTH_METHOD];
export type AuthMethodLabel = "password" | "social" | "passkey";
export const AUTH_METHOD_VALUES = [1, 2, 3] as const;
export const AUTH_METHOD_CODEC = createIntEnumCodec<
  AuthMethod,
  AuthMethodLabel
>([
  [AUTH_METHOD.PASSWORD, "password"],
  [AUTH_METHOD.SOCIAL, "social"],
  [AUTH_METHOD.PASSKEY, "passkey"],
]);

export const VERIFICATION_PURPOSE = {
  EMAIL_VERIFY: 1,
  PASSWORD_RESET: 2,
} as const;
export type VerificationPurpose =
  (typeof VERIFICATION_PURPOSE)[keyof typeof VERIFICATION_PURPOSE];
export type VerificationPurposeLabel = "email_verify" | "password_reset";
export const VERIFICATION_PURPOSE_VALUES = [1, 2] as const;
export const VERIFICATION_PURPOSE_CODEC = createIntEnumCodec<
  VerificationPurpose,
  VerificationPurposeLabel
>([
  [VERIFICATION_PURPOSE.EMAIL_VERIFY, "email_verify"],
  [VERIFICATION_PURPOSE.PASSWORD_RESET, "password_reset"],
]);

export const SOCIAL_PROVIDER = {
  GOOGLE: 1,
  FACEBOOK: 2,
} as const;
export type SocialProvider =
  (typeof SOCIAL_PROVIDER)[keyof typeof SOCIAL_PROVIDER];
export type SocialProviderLabel = "google" | "facebook";
export const SOCIAL_PROVIDER_VALUES = [1, 2] as const;
export const SOCIAL_PROVIDER_CODEC = createIntEnumCodec<
  SocialProvider,
  SocialProviderLabel
>([
  [SOCIAL_PROVIDER.GOOGLE, "google"],
  [SOCIAL_PROVIDER.FACEBOOK, "facebook"],
]);

export const CONSENT_TYPE = {
  TERMS: 1,
  PRIVACY: 2,
  CHILD_DATA: 3,
} as const;
export type ConsentType = (typeof CONSENT_TYPE)[keyof typeof CONSENT_TYPE];
export type ConsentTypeLabel = "terms" | "privacy" | "child_data";
export const CONSENT_TYPE_VALUES = [1, 2, 3] as const;
export const CONSENT_TYPE_CODEC = createIntEnumCodec<
  ConsentType,
  ConsentTypeLabel
>([
  [CONSENT_TYPE.TERMS, "terms"],
  [CONSENT_TYPE.PRIVACY, "privacy"],
  [CONSENT_TYPE.CHILD_DATA, "child_data"],
]);

export const CONSENT_ACTION = {
  ACCEPTED: 1,
  WITHDRAWN: 2,
} as const;
export type ConsentAction =
  (typeof CONSENT_ACTION)[keyof typeof CONSENT_ACTION];
export type ConsentActionLabel = "accepted" | "withdrawn";
export const CONSENT_ACTION_VALUES = [1, 2] as const;
export const CONSENT_ACTION_CODEC = createIntEnumCodec<
  ConsentAction,
  ConsentActionLabel
>([
  [CONSENT_ACTION.ACCEPTED, "accepted"],
  [CONSENT_ACTION.WITHDRAWN, "withdrawn"],
]);

export const MFA_RECOVERY_STATUS = {
  PENDING_VERIFICATION: 1,
  WAITING: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  EXPIRED: 5,
} as const;
export type MfaRecoveryStatus =
  (typeof MFA_RECOVERY_STATUS)[keyof typeof MFA_RECOVERY_STATUS];
export type MfaRecoveryStatusLabel =
  | "pending_verification"
  | "waiting"
  | "completed"
  | "cancelled"
  | "expired";
export const MFA_RECOVERY_STATUS_VALUES = [1, 2, 3, 4, 5] as const;
export const MFA_RECOVERY_STATUS_CODEC = createIntEnumCodec<
  MfaRecoveryStatus,
  MfaRecoveryStatusLabel
>([
  [MFA_RECOVERY_STATUS.PENDING_VERIFICATION, "pending_verification"],
  [MFA_RECOVERY_STATUS.WAITING, "waiting"],
  [MFA_RECOVERY_STATUS.COMPLETED, "completed"],
  [MFA_RECOVERY_STATUS.CANCELLED, "cancelled"],
  [MFA_RECOVERY_STATUS.EXPIRED, "expired"],
]);

export const CHILD_RELATIONSHIP = {
  CHILD: 1,
  STUDENT: 2,
  OTHER: 3,
} as const;
export type ChildRelationship =
  (typeof CHILD_RELATIONSHIP)[keyof typeof CHILD_RELATIONSHIP];
export type ChildRelationshipLabel = "child" | "student" | "other";
export const CHILD_RELATIONSHIP_VALUES = [1, 2, 3] as const;
export const CHILD_RELATIONSHIP_CODEC = createIntEnumCodec<
  ChildRelationship,
  ChildRelationshipLabel
>([
  [CHILD_RELATIONSHIP.CHILD, "child"],
  [CHILD_RELATIONSHIP.STUDENT, "student"],
  [CHILD_RELATIONSHIP.OTHER, "other"],
]);

export const CHILD_STATUS = {
  ACTIVE: 1,
  ARCHIVED: 2,
  PENDING_DELETION: 3,
} as const;
export type ChildStatus = (typeof CHILD_STATUS)[keyof typeof CHILD_STATUS];
export type ChildStatusLabel = "active" | "archived" | "pending_deletion";
export const CHILD_STATUS_VALUES = [1, 2, 3] as const;
export const CHILD_STATUS_CODEC = createIntEnumCodec<
  ChildStatus,
  ChildStatusLabel
>([
  [CHILD_STATUS.ACTIVE, "active"],
  [CHILD_STATUS.ARCHIVED, "archived"],
  [CHILD_STATUS.PENDING_DELETION, "pending_deletion"],
]);
