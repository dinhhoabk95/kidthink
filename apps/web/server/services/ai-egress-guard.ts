/**
 * MindKid AI Egress Guard
 * Enforces BR-AIA-01, BR-AIA-02, BR-CDC-06, BR-SEM-01, BR-SEM-02.
 * Strictly blocks child PII, UUIDs, birth dates, and canary tokens from leaving server boundaries.
 */

import { AppError } from "@mindkid/errors/base";
import {
  type AiEgressReportPayload,
  aiEgressReportPayloadSchema,
} from "@mindkid/shared";

export type EgressScalar = string | number | boolean | null | undefined;

export interface EgressRecord {
  readonly [key: string]: EgressPayloadValue;
}

export type EgressPayloadValue =
  | EgressScalar
  | EgressRecord
  | readonly EgressPayloadValue[];

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i, // Email
  /(?<!\w)(?:\(\+?84\)|\+84|0)(?:[\s.-]?\d){8,10}(?!\w)/, // Phone number (Vietnam)
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i, // Raw UUID
  /\[CANARY_[A-Z0-9_]+\]/i, // Canary tokens
  /canary-child-pii/i,
  /canary-user-id/i,
  /canary-raw-telemetry/i,
  /(?:^|[^\p{L}\d_])(?:ngày\s+sinh|sinh\s+ngày|sinh\s+năm|năm\s+sinh|dob|birthdate|birth_year|date_of_birth|sn)\s*[:=]?\s*(?:\d{1,2}[/-]\d{1,2}[/-](?:19|20)?\d{2}|(?:19|20)\d{2})(?=$|[^\p{L}\d_])/iu, // Birth year / DOB context
  /(?<!\d)(?:0?[1-9]|[12]\d|3[01])[/-](?:0?[1-9]|1[0-2])[/-](?:19|20)\d{2}(?!\d)/, // DD/MM/YYYY or DD-MM-YYYY
  /(?<!\d)(?:19|20)\d{2}[/-](?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])(?!\d)/, // YYYY-MM-DD
  /(?:^|[^\p{L}\d_])(?:[Bb][eéEÉ]|[Cc][Hh][aáAÁ][uU]|[Ee][Mm]|[Cc][Oo][Nn]|[Tt][Rr][eẻEẺ]|[Tt][eêEÊ][Nn][ \t]+[Ll][aàAÀ])[ \t]+(?:[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:[ \t]+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)*)/u, // Vietnamese child name with capitalized proper noun
];

const SENSITIVE_KEYS = new Set([
  "child_uuid",
  "childUuid",
  "child_id",
  "childId",
  "child_name",
  "childName",
  "display_name",
  "displayName",
  "birth_year",
  "birthYear",
  "date_of_birth",
  "dateOfBirth",
  "user_id",
  "userId",
  "full_name",
  "fullName",
  "parent_name",
  "parentName",
  "email",
  "phone",
  "phone_number",
  "phoneNumber",
  "address",
  "school",
  "telemetry_raw",
  "telemetryRaw",
  "telemetry_events",
  "telemetryEvents",
  "raw_event",
  "rawEvent",
]);

const CAMEL_TO_SNAKE_REGEX = /([a-z0-9])([A-Z])/g;

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

function isSensitiveKey(key: string): boolean {
  const snakeKey = key.replace(CAMEL_TO_SNAKE_REGEX, "$1_$2").toLowerCase();
  return (
    SENSITIVE_KEYS.has(key) ||
    SENSITIVE_KEYS.has(key.toLowerCase()) ||
    SENSITIVE_KEYS.has(snakeKey)
  );
}

function scanObject(
  obj: EgressRecord | object,
  path: string,
  visited: WeakSet<object>
): void {
  if (visited.has(obj)) {
    return;
  }
  visited.add(obj);

  for (const [key, value] of Object.entries(
    obj as Record<string, EgressPayloadValue>
  )) {
    if (isSensitiveKey(key)) {
      throw new AiEgressViolationError(
        `Privacy violation at ${path}: sensitive key "${key}" detected in payload`
      );
    }
    assertNoEgressViolation(value, `${path}.${key}`, visited);
  }
}

/**
 * Deep scan any object, array, or string payload for privacy violations.
 */
export function assertNoEgressViolation(
  payload: EgressPayloadValue | object,
  path = "root",
  visited: WeakSet<object> = new WeakSet()
): void {
  if (payload === null || payload === undefined) {
    return;
  }

  if (typeof payload === "string") {
    scanString(payload, path);
    return;
  }

  if (Array.isArray(payload)) {
    if (visited.has(payload)) {
      return;
    }
    visited.add(payload);
    for (let i = 0; i < payload.length; i++) {
      assertNoEgressViolation(payload[i], `${path}[${i}]`, visited);
    }
    return;
  }

  if (typeof payload === "object") {
    scanObject(payload, path, visited);
  }
}

/**
 * Validates report payload according to BR-AIA-01 / BR-AIA-02 / BR-CDC-06.
 * Ensures only aggregated metrics and skill titles are transmitted.
 */
export function validateAiReportEgress(
  payload: EgressPayloadValue | object
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
