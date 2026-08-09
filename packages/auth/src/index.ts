export {
  assertActiveChild,
  checkUserEntitlement,
  verifyChildOwnership,
} from "./actor-boundaries";
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
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  generateCsrfToken,
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
  KIDTHINK_ADMIN_AUDIENCE,
  type VerifyManagerTokenOptions,
  verifyAdminManagerToken,
} from "./manager-session";
export type {
  AccountReference,
  AccountType,
  AuditPort,
  AuthAuditEvent,
  AuthMethod,
  ChildOwnershipPort,
  EntitlementPort,
  RateLimitAxis,
  RateLimitDecision,
  RateLimitPort,
  RotateSessionInput,
  RotateSessionResult,
  SessionRecord,
  SessionStorePort,
} from "./ports";
export {
  type AvailableReauthMethodsResult,
  getAvailableReauthMethods,
  REAUTH_MAX_AGE_SECONDS,
  verifyReauthWindow,
} from "./reauth";
export {
  generateOpaqueRefreshToken,
  hashRefreshToken,
  RefreshService,
  type RefreshServiceOptions,
  type RotateTokenInput,
  type RotateTokenResult,
} from "./refresh";
export {
  type CreateUserTokenOptions,
  createWebUserToken,
  KIDTHINK_ISSUER,
  KIDTHINK_WEB_AUDIENCE,
  USER_ACCESS_TOKEN_TTL_SECONDS,
  type VerifyUserTokenOptions,
  verifyWebUserToken,
} from "./user-session";
