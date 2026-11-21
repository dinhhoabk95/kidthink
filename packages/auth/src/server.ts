import {
  AppError as BaseAppError,
  DEFAULT_ERROR_STATUS,
  ERROR_CODES,
  type ErrorCode,
  type ErrorDetails,
} from "@mindkid/errors";

const KNOWN_ERROR_STATUS: Readonly<Record<string, number>> = {
  UNAUTHENTICATED: 401,
  SESSION_REVOKED: 401,
  INVALID_CREDENTIALS: 401,
  INSUFFICIENT_ROLE: 403,
  TIER_LOCKED: 403,
  ACCOUNT_SUSPENDED: 403,
  ACCOUNT_DELETED: 403,
  RESTRICTED_MODE: 403,
  CSRF_INVALID: 403,
  NOT_FOUND: 404,
  EMAIL_ALREADY_REGISTERED: 409,
  EMAIL_ALREADY_IN_USE: 409,
  SOCIAL_EMAIL_CONFLICT: 409,
  SOCIAL_IDENTITY_ALREADY_LINKED: 409,
  CONSENT_REQUIREMENT_CHANGED: 409,
  VALIDATION_FAILED: 422,
  NO_ACTIVE_CHILD: 428,
  MFA_REQUIRED: 428,
  REAUTH_REQUIRED: 428,
  CONSENT_REQUIRED: 428,
  RATE_LIMITED: 429,
  MFA_LOCKED: 429,
  SERVICE_UNAVAILABLE: 503,
};

function resolveStatusForErrorCode(code: string): number {
  const isKnown = (ERROR_CODES as readonly string[]).includes(code);
  return isKnown ? (KNOWN_ERROR_STATUS[code] ?? DEFAULT_ERROR_STATUS) : 500;
}

export class AppError extends BaseAppError {
  constructor(code: ErrorCode, details?: ErrorDetails) {
    super({
      code,
      message: `Lỗi hệ thống (${code})`,
      status: resolveStatusForErrorCode(code),
      details,
      name: "AppError",
    });
  }
}

export function appError(code: ErrorCode, details?: ErrorDetails): AppError {
  return new AppError(code, details);
}
