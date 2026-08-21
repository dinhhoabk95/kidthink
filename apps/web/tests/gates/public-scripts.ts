import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

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

const APPS_WEB_PREFIX_REGEX = /^apps\/web\//;

export function scanDirectoryForThirdPartyScripts(
  dir: string
): ScriptLintViolation[] {
  const violations: ScriptLintViolation[] = [];

  function walk(currentPath: string) {
    if (!existsSync(currentPath)) {
      return;
    }
    const entries = readdirSync(currentPath);
    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (EXTENSION_REGEX.test(entry)) {
        const relPath = fullPath.replace(`${REPO_ROOT}/`, "");
        checkFile(fullPath, relPath, violations);
      }
    }
  }

  let targetPath = dir;
  if (!isAbsolute(dir)) {
    if (existsSync(join(REPO_ROOT, dir))) {
      targetPath = join(REPO_ROOT, dir);
    } else {
      targetPath = join(REPO_ROOT, dir.replace(APPS_WEB_PREFIX_REGEX, ""));
    }
  }

  walk(targetPath);
  return violations;
}

/** Cả hai mặt công khai của apps/web (BR-SEO2-08, BR-LND-04). */
export function runPublicScriptsGate(): ScriptLintViolation[] {
  return ["apps/web/app", "apps/web/server"].flatMap((dir) =>
    scanDirectoryForThirdPartyScripts(dir)
  );
}
