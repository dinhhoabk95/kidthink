import {
  checkRateLimit,
  type RateLimitCheckResult,
} from "../../cache/src/index.js";
import {
  calculateProgressiveLockoutSeconds,
  getRouteClassConfig,
  type RouteClassName,
} from "./rate-limiting.js";

export interface RateLimitRequestInput {
  routeClass: RouteClassName;
  /** Raw connection remote address (never unverified X-Forwarded-For) (BR-RTL-04). */
  remoteIp: string;
  accountIdentifier?: string; // email, user_id, or manager_id
  failedAttempts?: number;
}

export interface RateLimitResponsePayload {
  statusCode: 429 | 200;
  headers?: { "Retry-After"?: string };
  body?: {
    code: "RATE_LIMITED";
    message: string;
    details: { retry_after_s: number };
  };
}

/**
 * Enforces two-axis rate limiting middleware (Task 8 / BR-RTL-01..07).
 */
export async function enforceTwoAxisRateLimit(
  input: RateLimitRequestInput
): Promise<RateLimitResponsePayload> {
  const cfg = getRouteClassConfig(input.routeClass);

  // BR-RTL-04: Ensure IP is normalized and non-empty
  const safeIp = input.remoteIp.trim();
  if (!safeIp) {
    throw new Error("BR-RTL-04 violation: Missing verified IP address");
  }

  // Progressive lockout check for login attempts (BR-RTL-05)
  if (input.failedAttempts && input.failedAttempts >= 5) {
    const lockoutSec = calculateProgressiveLockoutSeconds(input.failedAttempts);
    return {
      statusCode: 429,
      headers: { "Retry-After": String(lockoutSec) },
      body: {
        code: "RATE_LIMITED",
        message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.",
        details: { retry_after_s: lockoutSec },
      },
    };
  }

  // Axis 1: IP Rate Limit
  const ipKey = `rl:ip:${cfg.className}:${safeIp}`;
  const ipCheck: RateLimitCheckResult = await checkRateLimit(
    ipKey,
    cfg.ipLimit,
    cfg.windowSeconds
  );

  if (!ipCheck.allowed) {
    return {
      statusCode: 429,
      headers: { "Retry-After": String(ipCheck.resetSeconds) },
      body: {
        code: "RATE_LIMITED",
        message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.",
        details: { retry_after_s: ipCheck.resetSeconds },
      },
    };
  }

  // Axis 2: Account / Identifier Rate Limit (if configured)
  if (cfg.accountLimit && input.accountIdentifier) {
    const accKey = `rl:acc:${cfg.className}:${input.accountIdentifier.toLowerCase()}`;
    const accCheck: RateLimitCheckResult = await checkRateLimit(
      accKey,
      cfg.accountLimit,
      cfg.windowSeconds
    );

    if (!accCheck.allowed) {
      return {
        statusCode: 429,
        headers: { "Retry-After": String(accCheck.resetSeconds) },
        body: {
          code: "RATE_LIMITED",
          message: "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.",
          details: { retry_after_s: accCheck.resetSeconds },
        },
      };
    }
  }

  return { statusCode: 200 };
}
