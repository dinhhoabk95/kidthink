export {
  assertActiveChild,
  checkUserEntitlement,
  verifyChildOwnership,
} from "./actor-boundaries.js";
export {
  type AuthNamespaceConfig,
  getAuthNamespaceConfig,
} from "./auth-namespace.js";
export {
  type BrowserSessionService,
  type CreateBrowserSessionInput,
  DefaultBrowserSessionService,
  type RestoreRememberSessionInput,
  type RevokeDeviceInput,
} from "./browser-session.js";
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
} from "./contracts.js";
export {
  CSRF_HEADER_NAME,
  generateCsrfToken,
  MANAGER_CSRF_COOKIE_NAME,
  USER_CSRF_COOKIE_NAME,
  type ValidateCsrfOptions,
  validateCsrfToken,
} from "./csrf.js";
export {
  AppError,
  AUTH_ERROR_DEFINITIONS,
  type AuthErrorCode,
  type AuthErrorDetails,
  type AuthErrorResponse,
  appError,
} from "./errors.js";
export {
  type CreatedMfaChallengeOutput,
  type CreateMfaChallengeInput,
  MFA_CHALLENGE_TTL_SECONDS,
  type MfaChallengePayload,
  MfaChallengeService,
} from "./mfa-challenge.js";
export {
  ActivityNotFoundError,
  ChildNotFoundError,
  CurriculumNotFoundError,
  CustomGameNotFoundError,
  EntitlementNotFoundError,
  ExportNotFoundError,
  GameLevelNotFoundError,
  isModelBoundError,
  LessonNotFoundError,
  LessonPlanNotFoundError,
  type ModelBoundError,
  ModelNotFoundError,
  modelErrorContext,
  OrderNotFoundError,
  PersonalCurriculumNotFoundError,
  PlaySessionNotFoundError,
  SubscriptionNotFoundError,
  UserNotFoundError,
  ValidationError,
  type ValidationFieldError,
  WorksheetNotFoundError,
} from "./model-errors.js";
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
} from "./parent-gate.js";
export {
  generateSecureToken,
  hashPassword,
  hashSecureToken,
  validatePasswordStrength,
  verifyPassword,
} from "./password.js";
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
  SessionRecord,
  SessionStorePort,
  UserSessionRecord,
} from "./ports.js";
export {
  CurrentSessionReauthService,
  REAUTH_MAX_AGE_SECONDS,
  verifyReauthWindow,
} from "./reauth.js";
export {
  isSensitiveReauthRoute,
  SENSITIVE_REAUTH_ROUTES,
  type SensitiveRouteDefinition,
} from "./reauth-routes.js";
export {
  getAuthRedisClient,
  getBrowserSessionService,
  setAuthRedisClient,
} from "./redis-client.js";
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
} from "./redis-session-store.js";
export {
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  generateTotpUri,
  hashRecoveryCode,
  verifyTotpCode,
} from "./totp.js";
