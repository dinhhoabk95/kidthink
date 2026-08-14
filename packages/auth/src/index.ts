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
  type BrowserSessionService,
  type CreateBrowserSessionInput,
  DefaultBrowserSessionService,
  type RestoreRememberSessionInput,
  type RevokeDeviceInput,
} from "./browser-session";
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
  type CreatedMfaChallengeOutput,
  type CreateMfaChallengeInput,
  MFA_CHALLENGE_TTL_SECONDS,
  type MfaChallengePayload,
  MfaChallengeService,
} from "./mfa-challenge";
export {
  getOAuthRegistry,
  type OAuthProviderConfig,
  OAuthProviderRegistry,
  type OAuthRegistryOptions,
} from "./oauth/registry.js";
export {
  decodeOAuthStatePayload,
  encodeOAuthStatePayload,
  generateOAuthState,
  OAUTH_COOKIE_NAME,
  OAUTH_STATE_TTL_SECONDS,
  sanitizeReturnTo,
} from "./oauth/state-store.js";
export {
  isOAuthProvider,
  type NormalizedProfile,
  OAUTH_PROVIDERS,
  type OAuthProvider,
  type OAuthProviderPublicInfo,
  type OAuthStatePayload,
} from "./oauth/types.js";
export {
  createParentGateToken,
  generateParentGateChallenge,
  isValidParentGateToken,
  type ParentGateChallenge,
  type ParentGateTokenPayload,
  verifyParentGateChallenge,
} from "./parent-gate";
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
  isSensitiveReauthRoute,
  SENSITIVE_REAUTH_ROUTES,
  type SensitiveRouteDefinition,
} from "./reauth-routes";
export {
  getAuthRedisClient,
  getBrowserSessionService,
  setAuthRedisClient,
} from "./redis-client";
export {
  type AuthNamespace as RedisAuthNamespace,
  type CreatedSessionOutput,
  type CreateSessionOptions,
  generateTokenHex,
  InMemoryRedisClient,
  type MinimalRedisClient,
  REMEMBER_MAX_TTL_SECONDS,
  RedisSessionStore,
  type RememberData,
  type RestoredSessionOutput,
  type RestoreOptions,
  SESSION_TTL_SECONDS,
  type SessionData,
  sha256,
} from "./redis-session-store";
export {
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  generateTotpUri,
  hashRecoveryCode,
  verifyTotpCode,
} from "./totp";
