/**
 * MindKid AI Egress Guard
 * Enforces BR-AIA-01, BR-AIA-02, BR-CDC-06, BR-SEM-01, BR-SEM-02.
 * Strictly blocks child PII, UUIDs, birth dates, and canary tokens from leaving server boundaries.
 */

import {
  type AiEgressReportPayload,
  aiEgressReportPayloadSchema,
} from "@mindkid/shared";

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i, // Email
  /\b(0\d{9,10}|\+84\d{9,10})\b/, // Phone number (Vietnam)
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i, // Raw UUID
  /\[CANARY_[A-Z0-9_]+\]/i, // Canary tokens
  /canary-child-pii/i,
  /canary-user-id/i,
  /canary-raw-telemetry/i,
  /\b(sinh năm|năm sinh|dob|birthdate|birth_year)\s*[:=]?\s*\d{4}\b/i, // Birth year context
];

const SENSITIVE_KEYS = new Set([
  "child_uuid",
  "child_id",
  "child_name",
  "display_name",
  "birth_year",
  "date_of_birth",
  "user_id",
  "email",
  "phone",
  "address",
  "telemetry_raw",
  "telemetry_events",
  "raw_event",
]);

import { AppError } from "@mindkid/errors/base";

export class AiEgressViolationError extends AppError {
  constructor(message: string) {
    super({
      code: "AI_EGRESS_VIOLATION",
      status: 400,
      message,
      name: "AiEgressViolationError",
    });
  }
}

function scanString(str: string, path: string): void {
  for (const pattern of PII_PATTERNS) {
    if (pattern.test(str)) {
      throw new AiEgressViolationError(
        `Privacy violation at ${path}: payload matches sensitive pattern ${pattern.source}`
      );
    }
  }
}

function scanObject(obj: Record<string, unknown>, path: string): void {
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      throw new AiEgressViolationError(
        `Privacy violation at ${path}: sensitive key "${key}" detected in payload`
      );
    }
    assertNoEgressViolation(value, `${path}.${key}`);
  }
}

/**
 * Deep scan any object, array, or string payload for privacy violations.
 */
export function assertNoEgressViolation(payload: unknown, path = "root"): void {
  if (payload === null || payload === undefined) {
    return;
  }

  if (typeof payload === "string") {
    scanString(payload, path);
    return;
  }

  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      assertNoEgressViolation(payload[i], `${path}[${i}]`);
    }
    return;
  }

  if (typeof payload === "object") {
    scanObject(payload as Record<string, unknown>, path);
  }
}

/**
 * Validates report payload according to BR-AIA-01 / BR-AIA-02 / BR-CDC-06.
 * Ensures only aggregated metrics and skill titles are transmitted.
 */
export function validateAiReportEgress(
  payload: unknown
): AiEgressReportPayload {
  if (!payload || typeof payload !== "object") {
    throw new AiEgressViolationError("Payload must be a non-null object");
  }

  assertNoEgressViolation(payload, "report_payload");

  const parsed = aiEgressReportPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const issueMessages = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new AiEgressViolationError(
      `BR-AIA-02: Invalid AI report payload schema: ${issueMessages}`
    );
  }

  return parsed.data;
}
