/**
 * PII and Secret Redaction Utility.
 * Source of truth: docs/specs/01-platform/monitoring-and-alerting.md §7.4, BR-MON-05, D-IS, D-IP.
 *
 * Mandatory Deny-List (7 core fields + auth secrets):
 * - display_name
 * - birth_year
 * - child_uuid
 * - email
 * - password
 * - token
 * - authorization
 * + provider tokens (D-IP)
 */

export const PII_DENY_LIST = new Set([
  "display_name",
  "birth_year",
  "child_uuid",
  "email",
  "password",
  "token",
  "authorization",
  // P1.15 provider token & credential additions (D-IP)
  "access_token",
  "refresh_token",
  "provider_token",
  "id_token",
  "client_secret",
  "secret",
  "password_hash",
  "mfa_secret",
  "recovery_code",
  "raw_token",
]);

export function isPiiKey(key: string): boolean {
  const normalized = key.toLowerCase().trim();
  if (PII_DENY_LIST.has(normalized)) {
    return true;
  }
  return (
    normalized.endsWith("_token") ||
    normalized.endsWith("_password") ||
    normalized.endsWith("_secret") ||
    normalized === "auth_header" ||
    normalized === "x-csrf-token"
  );
}

function redactPrimitive<T>(input: T): T {
  if (typeof input === "string" && input.toLowerCase().startsWith("bearer ")) {
    return "[REDACTED_BEARER_TOKEN]" as unknown as T;
  }
  return input;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isPiiKey(key)) {
      continue;
    }
    if (value && typeof value === "object") {
      result[key] = redactPii(value);
    } else if (
      typeof value === "string" &&
      value.toLowerCase().startsWith("bearer ")
    ) {
      result[key] = "[REDACTED_BEARER_TOKEN]";
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Deeply redacts PII and sensitive credentials from objects, arrays, and primitive values.
 * Returns a new object without modifying the original (immutability rule).
 * Deny-listed fields are completely stripped from object structures.
 */
export function redactPii<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input !== "object") {
    return redactPrimitive(input);
  }
  if (Array.isArray(input)) {
    return input.map((item) => redactPii(item)) as unknown as T;
  }
  if (
    input instanceof Date ||
    input instanceof RegExp ||
    input instanceof Error
  ) {
    return input;
  }
  return redactObject(input as Record<string, unknown>) as T;
}
