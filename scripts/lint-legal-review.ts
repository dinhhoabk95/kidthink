import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * BR-LGL-07 & D-HZ:
 * Verifies that no legal policies have reviewStatus = "pending_review" before production deployment.
 */

export interface LegalReviewCheckResult {
  valid: boolean;
  pendingDocs: string[];
}

export function checkLegalReviewStatus(
  fileContent?: string
): LegalReviewCheckResult {
  const content =
    fileContent ??
    readFileSync(
      join(process.cwd(), "packages/shared/src/public-seo.ts"),
      "utf-8"
    );

  const pendingMatches: string[] = [];
  const docBlockRegex =
    /slug:\s*["']([^"']+)["'][\s\S]*?reviewStatus:\s*["']([^"']+)["']/g;

  let match: RegExpExecArray | null = docBlockRegex.exec(content);
  while (match !== null) {
    const slug = match[1];
    const status = match[2];
    if (status === "pending_review") {
      pendingMatches.push(slug);
    }
    match = docBlockRegex.exec(content);
  }

  return {
    valid: pendingMatches.length === 0,
    pendingDocs: pendingMatches,
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = checkLegalReviewStatus();
  if (result.valid) {
    console.log(
      "✅ [lint:legal-review] All legal policies are reviewed and compliant."
    );
  } else {
    console.error(
      "❌ [lint:legal-review] Found legal policies pending review (BR-LGL-07 / D-HZ):"
    );
    for (const doc of result.pendingDocs) {
      console.error(`  - ${doc}`);
    }
    process.exit(1);
  }
}
