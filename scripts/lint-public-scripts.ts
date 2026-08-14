import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * BR-SEO2-08 & BR-LND-04 & D-IC:
 * Scans all public surface Vue/TS files for forbidden external script tags,
 * tracking pixels, font CDNs, or external iframes.
 */

export interface ScriptLintViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const FORBIDDEN_PATTERNS = [
  {
    pattern: /<script[^>]+src=["']https?:\/\//i,
    reason: "External script tag",
  },
  {
    pattern: /googletagmanager\.com|google-analytics\.com/i,
    reason: "Google Analytics / GTM tracking pixel",
  },
  { pattern: /connect\.facebook\.net|fbevents\.js/i, reason: "Facebook Pixel" },
  {
    pattern: /fonts\.googleapis\.com|fonts\.gstatic\.com/i,
    reason: "External font CDN",
  },
  { pattern: /<iframe[^>]+src=["']https?:\/\//i, reason: "External iframe" },
];

const EXTENSION_REGEX = /\.(vue|ts|js|html)$/;

function checkFile(
  fullPath: string,
  relativePath: string,
  violations: ScriptLintViolation[]
) {
  const content = readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: relativePath,
          line: i + 1,
          snippet: line.trim(),
          reason,
        });
      }
    }
  }
}

export function scanDirectoryForThirdPartyScripts(
  dir: string
): ScriptLintViolation[] {
  const violations: ScriptLintViolation[] = [];

  function walk(currentPath: string) {
    const entries = readdirSync(currentPath);
    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (EXTENSION_REGEX.test(entry)) {
        const relPath = fullPath.replace(`${process.cwd()}/`, "");
        checkFile(fullPath, relPath, violations);
      }
    }
  }

  walk(join(process.cwd(), dir));
  return violations;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const dirsToScan = ["apps/web/app", "apps/web/server"];
  let allViolations: ScriptLintViolation[] = [];

  for (const dir of dirsToScan) {
    allViolations = allViolations.concat(
      scanDirectoryForThirdPartyScripts(dir)
    );
  }

  if (allViolations.length > 0) {
    console.error(
      "❌ [lint:public-scripts] Found forbidden third-party scripts/pixels (BR-SEO2-08 / D-IC):"
    );
    for (const v of allViolations) {
      console.error(`  - ${v.file}:${v.line} (${v.reason}): ${v.snippet}`);
    }
    process.exit(1);
  } else {
    console.log(
      "✅ [lint:public-scripts] 0 third-party scripts found across public surfaces."
    );
  }
}
