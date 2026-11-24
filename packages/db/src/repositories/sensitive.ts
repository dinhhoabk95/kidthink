import type {
  managerAccounts,
  managerSessions,
  managers,
  managerTwoFactors,
  mfaRecoveryRequests,
  notificationEndpoints,
  userAccounts,
  userSessions,
  users,
  userTwoFactors,
} from "#src/schema/index";

export const PUBLIC_USER_COLUMNS = { passwordHash: false } as const;
export const PUBLIC_MANAGER_COLUMNS = { passwordHash: false } as const;
export const PUBLIC_USER_ACCOUNT_COLUMNS = {
  password: false,
  accessToken: false,
  refreshToken: false,
  idToken: false,
} as const;
export const PUBLIC_MANAGER_ACCOUNT_COLUMNS = {
  password: false,
  accessToken: false,
  refreshToken: false,
  idToken: false,
} as const;
export const PUBLIC_USER_SESSION_COLUMNS = { token: false } as const;
export const PUBLIC_MANAGER_SESSION_COLUMNS = { token: false } as const;
export const PUBLIC_TWO_FACTOR_COLUMNS = {
  secret: false,
  backupCodes: false,
} as const;
export const PUBLIC_MFA_RECOVERY_COLUMNS = {
  verificationTokenHash: false,
} as const;
export const PUBLIC_NOTIFICATION_ENDPOINT_COLUMNS = {
  tokenEncrypted: false,
  tokenFingerprint: false,
} as const;

export const USER_SENSITIVE_KEYS = ["passwordHash"] as const;
export const MANAGER_SENSITIVE_KEYS = ["passwordHash"] as const;
export const ACCOUNT_SENSITIVE_KEYS = [
  "password",
  "accessToken",
  "refreshToken",
  "idToken",
] as const;
export const SESSION_SENSITIVE_KEYS = ["token"] as const;
export const TWO_FACTOR_SENSITIVE_KEYS = ["secret", "backupCodes"] as const;
export const MFA_RECOVERY_SENSITIVE_KEYS = ["verificationTokenHash"] as const;
export const NOTIFICATION_ENDPOINT_SENSITIVE_KEYS = [
  "tokenEncrypted",
  "tokenFingerprint",
] as const;

export type PublicUser = Omit<typeof users.$inferSelect, "passwordHash">;
export type PublicManager = Omit<typeof managers.$inferSelect, "passwordHash">;
export type PublicUserAccount = Omit<
  typeof userAccounts.$inferSelect,
  "password" | "accessToken" | "refreshToken" | "idToken"
>;
export type PublicManagerAccount = Omit<
  typeof managerAccounts.$inferSelect,
  "password" | "accessToken" | "refreshToken" | "idToken"
>;
export type PublicUserSession = Omit<typeof userSessions.$inferSelect, "token">;
export type PublicManagerSession = Omit<
  typeof managerSessions.$inferSelect,
  "token"
>;
export type PublicUserTwoFactor = Omit<
  typeof userTwoFactors.$inferSelect,
  "secret" | "backupCodes"
>;
export type PublicManagerTwoFactor = Omit<
  typeof managerTwoFactors.$inferSelect,
  "secret" | "backupCodes"
>;
export type PublicMfaRecoveryRequest = Omit<
  typeof mfaRecoveryRequests.$inferSelect,
  "verificationTokenHash"
>;
export type PublicNotificationEndpoint = Omit<
  typeof notificationEndpoints.$inferSelect,
  "tokenEncrypted" | "tokenFingerprint"
>;

export function omitKeys<
  TRow extends object,
  const TKeys extends readonly (keyof TRow)[],
>(row: TRow, keys: TKeys): Omit<TRow, TKeys[number]> {
  const blocked = new Set<keyof TRow>(keys);
  const out: Partial<TRow> = {};
  for (const key of Object.keys(row) as (keyof TRow)[]) {
    if (!blocked.has(key)) {
      out[key] = row[key];
    }
  }
  return out as Omit<TRow, TKeys[number]>;
}
