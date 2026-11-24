export const DB_USER_STATUS = {
  PENDING_VERIFICATION: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  DELETED: 4,
} as const;

export const DB_MANAGER_ROLE = {
  SUPER_ADMIN: 1,
  CONTENT_REVIEWER: 2,
} as const;

export const DB_AUTH_METHOD = {
  PASSWORD: 1,
  SOCIAL: 2,
  PASSKEY: 3,
} as const;

export type UserStatusString =
  | "pending_verification"
  | "active"
  | "suspended"
  | "deleted";

export function decodeUserStatusValue(
  raw: string | number | undefined | null
): UserStatusString {
  if (raw === DB_USER_STATUS.ACTIVE || raw === "active") {
    return "active";
  }
  if (
    raw === DB_USER_STATUS.PENDING_VERIFICATION ||
    raw === "pending_verification"
  ) {
    return "pending_verification";
  }
  if (raw === DB_USER_STATUS.DELETED || raw === "deleted") {
    return "deleted";
  }
  return "suspended";
}

export function encodeUserStatusValue(status: string): number {
  switch (status) {
    case "pending_verification":
      return DB_USER_STATUS.PENDING_VERIFICATION;
    case "active":
      return DB_USER_STATUS.ACTIVE;
    case "deleted":
      return DB_USER_STATUS.DELETED;
    default:
      return DB_USER_STATUS.SUSPENDED;
  }
}

export function decodeManagerRoleValue(
  raw: string | number | undefined | null
): "super_admin" | "content_reviewer" {
  if (raw === DB_MANAGER_ROLE.SUPER_ADMIN || raw === "super_admin") {
    return "super_admin";
  }
  return "content_reviewer";
}
