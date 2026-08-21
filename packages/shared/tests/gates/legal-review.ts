import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";

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
    readFileSync(repoPath("packages/shared/src/public-seo.ts"), "utf-8");

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
