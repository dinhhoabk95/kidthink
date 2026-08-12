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
  statusCode: 429 | 503 | 200;
  headers?: { "Retry-After"?: string };
  body?: {
    code: "RATE_LIMITED" | "SERVICE_UNAVAILABLE";
    message: string;
    details?: { retry_after_s: number };
  };
}

/**
 * Enforces two-axis rate limiting middleware (Task 8 & 10 / BR-RTL-01..07).
 * Outage behavior (BR-RTL-02):
 * - failMode = "closed": returns 503 SERVICE_UNAVAILABLE (Auth & Billing)
 * - failMode = "open": returns 200 (serves request)
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

  try {
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
  } catch (_error) {
    // BR-RTL-02: Fail closed for sensitive routes on outage, fail open for others
    if (cfg.failMode === "closed") {
      return {
        statusCode: 503,
        body: {
          code: "SERVICE_UNAVAILABLE",
          message: "Hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.",
        },
      };
    }
    return { statusCode: 200 };
  }
}
