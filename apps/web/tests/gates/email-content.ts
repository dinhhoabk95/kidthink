import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";

/**
 * Forbidden child PII fields in email templates (BR-NOT-03).
 * Only `display_name` is allowed.
 */
const FORBIDDEN_CHILD_PII_REGEX =
  /\b(birth_year|child_id|real_name|gender|avatar_url|school_name)\b/i;

/**
 * Tracking pixel / open tracking URL pattern (BR-NOT-08).
 */
const TRACKING_PIXEL_REGEX =
  /<img[^>]+(width=["']1["']|height=["']1["']|track|pixel)[^>]*>/i;

/**
 * Forbidden pressuring / sales phrases in Vietnamese (BR-NOT-06 / §7.3).
 */
const FORBIDDEN_PRESSURING_PHRASES = [
  "đừng bỏ lỡ",
  "giảm giá",
  "khuyến mãi",
  "mua ngay",
  "đếm ngược",
  "so với bé khác",
  "giỏi hơn bé",
];

export interface EmailContentLintViolation {
  file: string;
  line: number;
  message: string;
}

export function lintEmailContentText(
  content: string,
  filePath = "template.html",
  isPeriodic = false
): EmailContentLintViolation[] {
  const violations: EmailContentLintViolation[] = [];
  const lines = content.split("\n");

  // BR-NOT-07 check for periodic emails
  if (isPeriodic && !content.includes("unsubscribe")) {
    violations.push({
      file: filePath,
      line: 1,
      message:
        "BR-NOT-07 violation: Periodic email template missing required unsubscribe link",
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // BR-NOT-03 check
    if (FORBIDDEN_CHILD_PII_REGEX.test(line)) {
      violations.push({
        file: filePath,
        line: i + 1,
        message: `BR-NOT-03 violation: Forbidden child PII in email content: "${line.trim()}"`,
      });
    }

    // BR-NOT-08 check
    if (TRACKING_PIXEL_REGEX.test(line)) {
      violations.push({
        file: filePath,
        line: i + 1,
        message: `BR-NOT-08 violation: Tracking pixel or 1x1 image detected: "${line.trim()}"`,
      });
    }

    // Pressuring phrases check
    for (const phrase of FORBIDDEN_PRESSURING_PHRASES) {
      if (line.toLowerCase().includes(phrase)) {
        violations.push({
          file: filePath,
          line: i + 1,
          message: `§7.3 violation: Pressuring or marketing phrase "${phrase}" forbidden in email content`,
        });
      }
    }
  }

  return violations;
}

/**
 * Scans email templates directory.
 */
export function lintEmailTemplates(
  dirPath: string
): EmailContentLintViolation[] {
  const violations: EmailContentLintViolation[] = [];

  if (!fs.existsSync(dirPath)) {
    return violations;
  }

  const files = fs.readdirSync(dirPath, { recursive: true });
  for (const f of files) {
    const fullPath = path.join(dirPath, String(f));
    if (
      fs.statSync(fullPath).isFile() &&
      (fullPath.endsWith(".html") || fullPath.endsWith(".ts"))
    ) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const isPeriodic =
        fullPath.includes("weekly") || fullPath.includes("content_new");
      violations.push(...lintEmailContentText(content, fullPath, isPeriodic));
    }
  }

  return violations;
}

/** BR-NOT-03/07/08 trên thư mục template email thật. */
export function runEmailContentGate(): EmailContentLintViolation[] {
  return lintEmailTemplates(repoPath("apps/web/server/templates"));
}
