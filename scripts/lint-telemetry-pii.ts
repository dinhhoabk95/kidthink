import { readFileSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN_PII_PATTERNS = [
  /child_name/i,
  /full_name/i,
  /birth_date/i,
  /user_email/i,
  /phone_number/i,
  /ssn/i,
];

export function scanSchemaForPii(content: string): {
  valid: boolean;
  errors: string[];
} {
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

function main() {
  const root = process.cwd();
  const playSchemaPath = join(root, "packages/db/src/schema/play.ts");
  const content = readFileSync(playSchemaPath, "utf-8");

  const result = scanSchemaForPii(content);
  if (!result.valid) {
    console.error("❌ [lint:telemetry-pii] PII check failed:", result.errors);
    process.exit(1);
  }

  console.log(
    "✅ [lint:telemetry-pii] BR-TLM-03 & D-GA PII check passed cleanly."
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
