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
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .trim();
  if (PII_DENY_LIST.has(normalized)) {
    return true;
  }
  return (
    normalized.endsWith("_token") ||
    normalized.endsWith("_password") ||
    normalized.endsWith("_secret") ||
    normalized === "auth_header" ||
    normalized === "x-csrf-token" ||
    normalized === "api_key" ||
    normalized === "apikey" ||
    normalized === "x-api-key" ||
    normalized.endsWith("_key")
  );
}

export type RedactableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object;

function redactString(input: string): string {
  if (input.toLowerCase().startsWith("bearer ")) {
    return "[REDACTED_BEARER_TOKEN]";
  }
  return input;
}

function redactPrimitive<T>(input: T): T {
  if (typeof input === "string") {
    return redactString(input) as T & string;
  }
  return input;
}

function redactObject(
  obj: Record<string, RedactableValue>,
  seen: WeakSet<object>
): Record<string, RedactableValue> {
  const result: Record<string, RedactableValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isPiiKey(key)) {
      continue;
    }
    if (value && typeof value === "object") {
      result[key] = redactPii(value, seen);
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

function redactError(
  err: Error,
  seen: WeakSet<object>
): Record<string, RedactableValue> {
  const result: Record<string, RedactableValue> = {
    name: err.name,
    message: redactString(err.message),
  };
  if ("cause" in err && err.cause !== undefined) {
    result.cause = redactPii(err.cause as RedactableValue, seen);
  }
  for (const [key, value] of Object.entries(err)) {
    if (!isPiiKey(key)) {
      result[key] = redactPii(value as RedactableValue, seen);
    }
  }
  return result;
}

/**
 * Deeply redacts PII and sensitive credentials from objects, arrays, and primitive values.
 * Returns a new object without modifying the original (immutability rule).
 * Deny-listed fields are completely stripped from object structures.
 */
export function redactPii<T>(
  input: T,
  seen: WeakSet<object> = new WeakSet<object>()
): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input !== "object") {
    return redactPrimitive(input);
  }
  if (seen.has(input)) {
    return "[CIRCULAR]" as T & string;
  }
  seen.add(input);

  if (Array.isArray(input)) {
    const mapped: RedactableValue[] = input.map((item: RedactableValue) =>
      redactPii(item, seen)
    );
    return mapped as T & RedactableValue[];
  }
  if (input instanceof Date || input instanceof RegExp) {
    return input;
  }
  if (input instanceof Error) {
    return redactError(input, seen) as T & Record<string, RedactableValue>;
  }
  return redactObject(input as Record<string, RedactableValue>, seen) as T;
}
