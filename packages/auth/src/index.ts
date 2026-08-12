export {
  assertActiveChild,
  checkUserEntitlement,
  verifyChildOwnership,
} from "./actor-boundaries";
export {
  type AuthNamespaceConfig,
  getAuthNamespaceConfig,
} from "./auth-namespace";
export {
  type AuthContext,
  type AuthEvent,
  createAuthContext,
  type GuestAuthContext,
  type ManagerAuthContext,
  type ManagerRole,
  type ManagerTokenPayload,
  requireManagerAuth,
  requireRole,
  requireUserAuth,
  type UserAuthContext,
  type UserTokenPayload,
} from "./contracts";
export {
  CSRF_HEADER_NAME,
  generateCsrfToken,
  MANAGER_CSRF_COOKIE_NAME,
  USER_CSRF_COOKIE_NAME,
  type ValidateCsrfOptions,
  validateCsrfToken,
} from "./csrf";
export {
  AppError,
  AUTH_ERROR_DEFINITIONS,
  type AuthErrorCode,
  type AuthErrorDetails,
  type AuthErrorResponse,
  appError,
} from "./errors";
export {
  type CreateManagerTokenOptions,
  createAdminManagerToken,
  createMfaChallengeToken,
  KIDTHINK_ADMIN_ISSUER,
  KIDTHINK_MANAGER_AUDIENCE,
  type VerifyManagerTokenOptions,
  verifyAdminManagerToken,
  verifyMfaChallengeToken,
} from "./manager-session";
export {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
  validatePasswordStrength,
  verifyPassword,
} from "./password";
export type {
  AccountReference,
  AccountType,
  AuditPort,
  AuthAuditEvent,
  AuthMethod,
  ChildOwnershipPort,
  EntitlementPort,
  ManagerSessionRecord,
  RateLimitAxis,
  RateLimitDecision,
  RateLimitPort,
  ReauthMethod,
  ReauthMethodAvailabilityPort,
  RotateSessionInput,
  RotateSessionResult,
  SessionRecord,
  SessionStorePort,
  UserSessionRecord,
} from "./ports";
export {
  CurrentSessionReauthService,
  REAUTH_MAX_AGE_SECONDS,
  verifyReauthWindow,
} from "./reauth";
export {
  type AuthNamespace,
  type CreateRefreshTokenOptions,
  createRefreshToken,
  hashRefreshToken,
  RefreshService,
  type RefreshServiceOptions,
  type RotateTokenInput,
  type RotateTokenResult,
  type VerifiedRefreshToken,
  verifyRefreshToken,
} from "./refresh";
export {
  base32Decode,
  base32Encode,
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from "./totp";
export {
  type CreateUserTokenOptions,
  createWebUserToken,
  KIDTHINK_USER_AUDIENCE,
  KIDTHINK_WEB_ISSUER,
  USER_ACCESS_TOKEN_TTL_SECONDS,
  type VerifyUserTokenOptions,
  verifyWebUserToken,
} from "./user-session";
