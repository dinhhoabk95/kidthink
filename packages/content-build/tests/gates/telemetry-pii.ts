import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

const FORBIDDEN_PII_PATTERNS = [
  /child_name/i,
  /full_name/i,
  /birth_date/i,
  /user_email/i,
  /phone_number/i,
  /ssn/i,
];

export interface PiiScanResult {
  readonly valid: boolean;
  readonly errors: string[];
}

export function scanSchemaForPii(content: string): PiiScanResult {
  const errors: string[] = [];

  for (const pattern of FORBIDDEN_PII_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(
        `BR-TLM-03 / D-GA: Found forbidden PII pattern matching ${pattern.source}`
      );
    }
  }

  // Check telemetry_events definition specifically for child_id vs child_uuid
  if (
    (content.includes("telemetryEvents") ||
      content.includes("telemetry_events")) &&
    content.includes("childId") &&
    !content.includes("childUuid")
  ) {
    errors.push(
      "BR-TLM-03 / D-GA: telemetry_events must use child_uuid, not child_id"
    );
  }

  return { valid: errors.length === 0, errors };
}

/** BR-TLM-03 / D-GA trên schema thật của `packages/db`. */
export function runTelemetryPiiGate(): PiiScanResult {
  return scanSchemaForPii(
    readFileSync(join(REPO_ROOT, "packages/db/src/schema/play.ts"), "utf-8")
  );
}
