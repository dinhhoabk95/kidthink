/**
 * Cổng kiểm tra tính toàn vẹn và bất biến của Business Rules (BR-REG2-01..04).
 *
 * SPEC: docs/specs/00-foundation/business-rules.md
 * - BR-REG2-01: Prefix BR duy nhất toàn corpus và đã đăng ký trong business-rules.md §7.1.
 * - BR-REG2-02: ID rule bất biến — không xoá, không đổi mã, không tái dùng mã đã có.
 * - BR-REG2-03: Cột "vì sao" không được để trống (được kiểm tra qua C6 trong lint:specs).
 * - BR-REG2-04: Mọi rule trong §7.3 phải tồn tại và được bảo vệ bất biến.
 */

/* biome-ignore-all lint/performance/useTopLevelRegex: script runs once, regex perf irrelevant */
/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: multi-rule validation checks */
/* biome-ignore-all lint/style/noNonNullAssertion: array index access after bounds check */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

export const ROOT = REPO_ROOT;
export const SPECS_DIR = path.join(ROOT, "docs", "specs");
export const BUSINESS_RULES_MD = path.join(
  SPECS_DIR,
  "00-foundation",
  "business-rules.md"
);

export interface DefinedRule {
  readonly id: string;
  readonly prefix: string;
  readonly file: string;
  readonly line: number;
  readonly ruleText: string;
  readonly reason: string;
}

export interface PrefixMapping {
  readonly prefix: string;
  readonly specFile: string;
}

export interface RuleLintViolation {
  readonly rule: "BR-REG2-01" | "BR-REG2-02" | "BR-REG2-04";
  readonly id?: string;
  readonly file: string;
  readonly line?: number;
  readonly message: string;
}

/**
 * Trích xuất danh sách prefix mapping từ business-rules.md §7.1
 */
export function extractRegisteredPrefixes(
  businessRulesContent: string
): Map<string, string> {
  const map = new Map<string, string>();
  const lines = businessRulesContent.split(/\r?\n/);
  let inSection7 = false;

  for (const line of lines) {
    if (line.startsWith("## 7. Data") || line.startsWith("### 7.1")) {
      inSection7 = true;
    } else if (
      line.startsWith("### 7.2") ||
      line.startsWith("### 7.3") ||
      line.startsWith("## 8.")
    ) {
      inSection7 = false;
    }

    if (inSection7) {
      // Bắt dòng bảng: | `BR-XXX` | [`file.md`](path/file.md) |
      const rowMatches = line.matchAll(
        /\|\s*`(BR-[A-Z0-9]+)`\s*\|\s*\[`?([^`\]]+)`?\]\(([^)]+)\)/g
      );
      for (const match of rowMatches) {
        const prefix = match[1];
        const targetLink = match[3];
        if (prefix && targetLink) {
          const cleanTarget = path
            .normalize(targetLink)
            .split(path.sep)
            .join("/");
          map.set(prefix, cleanTarget);
        }
      }
    }
  }

  return map;
}

/**
 * Trích xuất danh sách invariant rule IDs từ business-rules.md §7.3
 */
export function extractInvariantRuleIds(
  businessRulesContent: string
): string[] {
  const ids: string[] = [];
  const lines = businessRulesContent.split(/\r?\n/);
  let inSection73 = false;

  for (const line of lines) {
    if (line.startsWith("### 7.3")) {
      inSection73 = true;
    } else if (
      inSection73 &&
      (line.startsWith("### ") || line.startsWith("## "))
    ) {
      inSection73 = false;
    }

    if (inSection73) {
      const match = line.match(/\|\s*`(BR-[A-Z0-9]+-\d+[a-z]?)`/);
      if (match?.[1]) {
        ids.push(match[1]);
      }
    }
  }

  return ids;
}

/**
 * Quét toàn bộ file .md trong specsDir để trích xuất các rule được định nghĩa
 */
export function extractDefinedRules(
  specsDir: string = SPECS_DIR
): DefinedRule[] {
  const rules: DefinedRule[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) {
      return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Chỉ quét thư mục area dạng 00-foundation, 01-platform, ...
        if (dir === specsDir && !/^\d{2}-/.test(entry.name)) {
          continue;
        }
        walk(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        dir !== specsDir
      ) {
        const rel = path.relative(specsDir, fullPath).split(path.sep).join("/");
        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split(/\r?\n/);

        // Không quét định nghĩa rule từ chính file registry business-rules.md trừ các rule của BR-REG2
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          const brMatch = line.match(
            /^\|\s*`(BR-([A-Z0-9]+)-\d+[a-z]?)`[^|]*\|\s*([^|]+)\|\s*([^|]+)\|/
          );
          if (brMatch?.[1] && brMatch[2] && brMatch[3]) {
            const id = brMatch[1];
            const prefix = `BR-${brMatch[2]}`;
            const ruleText = brMatch[3].trim();
            const reason = (brMatch[4] || "").trim();

            if (
              rel === "00-foundation/business-rules.md" &&
              prefix !== "BR-REG2"
            ) {
              // Bỏ qua các hàng trích dẫn tham chiếu trong bảng §7.3
              continue;
            }

            rules.push({
              id,
              prefix,
              file: rel,
              line: i + 1,
              ruleText,
              reason,
            });
          }
        }
      }
    }
  }

  walk(specsDir);
  return rules;
}

/**
 * Lấy danh sách quy tắc từ commit HEAD qua git
 */
export function extractHeadRules(
  specsDirRel = "docs/specs"
): Map<string, { file: string; ruleText: string }> {
  const headRules = new Map<string, { file: string; ruleText: string }>();

  try {
    const gitOutput = execSync(
      `git grep -n "^| \`BR-" HEAD -- "${specsDirRel}/[0-9][0-9]-*"`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      }
    );

    const lines = gitOutput.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(
        /^HEAD:([^:]+):\d+:\|\s*`(BR-([A-Z0-9]+)-\d+[a-z]?)`[^|]*\|\s*([^|]+)\|/
      );
      if (match?.[1] && match[2] && match[3] && match[4]) {
        const filePath = match[1];
        const id = match[2];
        const prefix = `BR-${match[3]}`;
        const ruleText = match[4].trim();

        if (
          filePath.endsWith("00-foundation/business-rules.md") &&
          prefix !== "BR-REG2"
        ) {
          continue;
        }

        headRules.set(id, { file: filePath, ruleText });
      }
    }
  } catch {
    // Nếu không có git repository hoặc không có commit HEAD, bỏ qua so sánh HEAD
  }

  return headRules;
}

/**
 * Kiểm tra các vi phạm BR-REG2-01, BR-REG2-02, BR-REG2-04
 */
export function checkRuleIntegrity(options?: {
  specsDir?: string;
  businessRulesContent?: string;
  headRules?: Map<string, { file: string; ruleText: string }>;
}): RuleLintViolation[] {
  const specsDir = options?.specsDir ?? SPECS_DIR;
  const brContent =
    options?.businessRulesContent ??
    (fs.existsSync(BUSINESS_RULES_MD)
      ? fs.readFileSync(BUSINESS_RULES_MD, "utf8")
      : "");

  const violations: RuleLintViolation[] = [];
  const registeredPrefixes = extractRegisteredPrefixes(brContent);
  const invariantRuleIds = extractInvariantRuleIds(brContent);
  const currentRules = extractDefinedRules(specsDir);
  const currentRulesMap = new Map<string, DefinedRule>();

  // 1. Kiểm tra BR-REG2-01: Prefix phải được đăng ký
  for (const rule of currentRules) {
    currentRulesMap.set(rule.id, rule);
    if (!registeredPrefixes.has(rule.prefix)) {
      violations.push({
        rule: "BR-REG2-01",
        id: rule.id,
        file: rule.file,
        line: rule.line,
        message: `Prefix '${rule.prefix}' của rule '${rule.id}' chưa được đăng ký trong business-rules.md §7.1.`,
      });
    }
  }

  // 2. Kiểm tra BR-REG2-04: Các invariant rule trong §7.3 phải tồn tại
  for (const invId of invariantRuleIds) {
    if (!currentRulesMap.has(invId)) {
      violations.push({
        rule: "BR-REG2-04",
        id: invId,
        file: "00-foundation/business-rules.md",
        message: `Invariant rule '${invId}' được liệt kê trong §7.3 nhưng không tồn tại trong corpus spec nào.`,
      });
    }
  }

  // 3. Kiểm tra BR-REG2-02: ID bất biến so với baseline / HEAD
  const headRules = options?.headRules ?? extractHeadRules();
  if (headRules.size > 0) {
    for (const [headId, headData] of headRules) {
      const currentRule = currentRulesMap.get(headId);
      if (!currentRule) {
        violations.push({
          rule: "BR-REG2-02",
          id: headId,
          file: headData.file,
          message: `Rule '${headId}' từng tồn tại ở HEAD nhưng đã bị xoá khỏi corpus (vi phạm tính bất biến BR-REG2-02).`,
        });
      }
    }
  }

  return violations;
}
