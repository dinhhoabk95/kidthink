import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

/**
 * Cổng `BR-A11-09` — Cấm IN HOA (`uppercase` / `text-transform: uppercase`)
 * trên bề mặt trẻ vì dấu thanh tiếng Việt chồng chéo ở chữ hoa, trẻ 3–6 tuổi
 * không đọc được.
 */
export const KID_SURFACE_SCAN_PATHS: readonly string[] = [
  "apps/web/app/pages/play",
  "apps/web/app/components/kid",
  "apps/web/app/layouts/kid.vue",
  "apps/web/app/assets/css/play-surface.css",
];

export interface KidUppercaseViolation {
  readonly file: string;
  readonly line: number;
  readonly kind: "tailwind-class" | "css-text-transform";
  readonly snippet: string;
}

const CLASS_ATTR_REGEX = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const UPPERCASE_TOKEN_REGEX = /(?:^|\s)uppercase(?:\s|$)/;
const CSS_UPPERCASE_REGEX = /text-transform\s*:\s*uppercase\b/i;

function collectTargetFiles(relPaths: readonly string[]): string[] {
  const result: string[] = [];

  function walk(absPath: string): void {
    const stat = statSync(absPath);
    if (stat.isDirectory()) {
      const entries = readdirSync(absPath).sort();
      for (const entry of entries) {
        walk(join(absPath, entry));
      }
      return;
    }
    if (absPath.endsWith(".vue") || absPath.endsWith(".css")) {
      result.push(absPath);
    }
  }

  for (const rel of relPaths) {
    walk(join(REPO_ROOT, rel));
  }
  return result;
}

export function scanKidSurfaceUppercase(
  content: string,
  fileLabel = "inline.vue"
): KidUppercaseViolation[] {
  const violations: KidUppercaseViolation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;

    const classMatches = line.matchAll(CLASS_ATTR_REGEX);
    for (const match of classMatches) {
      const classValue = match[1] ?? match[2] ?? "";
      if (UPPERCASE_TOKEN_REGEX.test(classValue)) {
        violations.push({
          file: fileLabel,
          line: lineNumber,
          kind: "tailwind-class",
          snippet: line.trim(),
        });
      }
    }

    if (CSS_UPPERCASE_REGEX.test(line)) {
      violations.push({
        file: fileLabel,
        line: lineNumber,
        kind: "css-text-transform",
        snippet: line.trim(),
      });
    }
  }

  return violations;
}

export function runKidSurfaceVietnameseUppercaseGate(): KidUppercaseViolation[] {
  const files = collectTargetFiles(KID_SURFACE_SCAN_PATHS);
  if (files.length === 0) {
    throw new Error(
      "BR-A11-09: Không tìm thấy file bề mặt trẻ nào để quét — kiểm tra lại đường dẫn."
    );
  }

  const allViolations: KidUppercaseViolation[] = [];
  for (const absFile of files) {
    const relFile = relative(REPO_ROOT, absFile);
    const content = readFileSync(absFile, "utf8");
    allViolations.push(...scanKidSurfaceUppercase(content, relFile));
  }
  return allViolations;
}
