export {
  assertActiveChild,
  checkUserEntitlement,
  verifyChildOwnership,
} from "./actor-boundaries.js";
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
  DB_AUTH_METHOD,
  DB_MANAGER_ROLE,
  DB_USER_STATUS,
  decodeManagerRoleValue,
  decodeUserStatusValue,
  encodeUserStatusValue,
} from "./enum-values.js";
export {
  type AuthInstanceNamespace,
  deriveInstanceSecret,
} from "./hmac-secret.js";
export {
  type CreateMindKidManagerAuthDeps,
  createMindKidManagerAuth,
  type ManagerAuditAction,
  type ManagerAuthCallbacks,
  type ManagerAuthSchemaTables,
  type ManagerStatusSnapshot,
  type MindKidManagerAuth,
} from "./manager-better-auth.js";
export {
  MFA_LOCK_SECONDS,
  MFA_MAX_FAILURES,
  MfaAttemptGuard,
  type MfaFailureResult,
} from "./mfa-lockout.js";
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
  getDummyPasswordHash,
  hashPassword,
  hashPasswordPbkdf2,
  hashSecureToken,
  needsPasswordRehash,
  PBKDF2_ITERATIONS,
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
  type AuthCoordinatorRpcPort,
  createDurableObjectRedisClient,
  enterAuthCoordinatorPort,
  getAuthRedisClient,
  registerAuthCoordinatorPort,
  setAuthRedisClient,
} from "./redis-client.js";
export {
  buildAuthSentinelKey,
  consumeSocialSignupConsentTicket,
  createRedisSecondaryStorage,
  createSocialSignupConsentTicket,
  generateTokenHex,
  InMemoryRedisClient,
  type MinimalRedisClient,
  SOCIAL_SIGNUP_CONSENT_COOKIE,
  SOCIAL_SIGNUP_CONSENT_TTL_SECONDS,
  type SocialSignupConsentPayload,
  sha256Hex,
} from "./redis-secondary-storage.js";
export { AppError, appError } from "./server.js";
export { generateTotpCode, verifyBetterAuthTotp } from "./totp-verify.js";
export type {
  EmailSignupConsentInput,
  OAuthClientCredentials,
  UserAuthCallbacks,
  UserAuthSchemaTables,
  UserEmailCallbackInput,
  UserStatusSnapshot,
} from "./user-auth-types.js";
export {
  type CreateMindKidUserAuthDeps,
  createMindKidUserAuth,
  getEnabledOAuthProviders,
  type MindKidUserAuth,
  REAUTH_FRESH_AGE_SECONDS,
  REMEMBER_MAX_TTL_SECONDS,
  SESSION_DEFAULT_TTL_SECONDS,
} from "./user-better-auth.js";
