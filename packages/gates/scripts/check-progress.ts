/**
 * Chặn tick tiến độ không có bằng chứng — docs/tasks/14 §10.
 *
 * Script chỉ đọc worktree và git metadata. Không sửa checklist hay spec.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { collectSpecFiles, parseFrontmatter } from "#src/lint-specs-lib";
import {
  ownedRuleIds,
  type ProgressSpec,
  parseRulePrefixRegistry,
  validateProgress,
} from "./check-progress-lib.ts";

const ROOT = REPO_ROOT;
const CHECKLIST_REL = "docs/tasks/14-implementation-sequence-todo.md";
const CHECKLIST = join(ROOT, CHECKLIST_REL);
const BUSINESS_RULES = join(ROOT, "docs/specs/00-foundation/business-rules.md");
const BUSINESS_RULE_PATTERN = /\bBR-[A-Z0-9]+-\d+\b/g;
const SECTION_6_PATTERN = /\n## 6\. /;
const SECTION_7_PATTERN = /\n## 7\. /;
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

function readHeadChecklist(): string {
  try {
    return execFileSync("git", ["show", `HEAD:${CHECKLIST_REL}`], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function readIndexFile(path: string): string | undefined {
  try {
    return execFileSync("git", ["show", `:${path}`], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return undefined;
  }
}

function collectStagedPaths(): string[] {
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    { cwd: ROOT, encoding: "utf8" }
  );
  return output.split("\0").filter(Boolean);
}

function collectChangedPaths(): string[] {
  const output = execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all", "-z"],
    { cwd: ROOT, encoding: "utf8" }
  );
  return output
    .split("\0")
    .filter(Boolean)
    .map((record) => record.slice(3))
    .map((path) => path.split(" -> ").at(-1) ?? path);
}

function businessRulesCitedBySpec(content: string): string[] {
  const section =
    content.split(SECTION_7_PATTERN, 1)[0]?.split(SECTION_6_PATTERN)[1] ?? "";
  return [...new Set(section.match(BUSINESS_RULE_PATTERN) ?? [])];
}

function collectProgressSpecs(fromIndex: boolean): ProgressSpec[] {
  const registry = parseRulePrefixRegistry(
    readSnapshotFile(BUSINESS_RULES, fromIndex) ?? ""
  );
  return collectSpecFiles().map((spec) => {
    const content = fromIndex
      ? (readIndexFile(relative(ROOT, spec.path)) ?? spec.content)
      : spec.content;
    const frontmatter = parseFrontmatter(content).data;
    const citedRuleIds = businessRulesCitedBySpec(content);
    return {
      id: String(frontmatter.spec ?? ""),
      phase: String(frontmatter.phase ?? ""),
      rel: spec.rel,
      status: String(frontmatter.status ?? ""),
      citedRuleIds,
      ownedRuleIds: ownedRuleIds(citedRuleIds, spec.rel, registry),
    };
  });
}

function readSnapshotFile(
  path: string,
  fromIndex: boolean
): string | undefined {
  return fromIndex
    ? readIndexFile(relative(ROOT, path))
    : readFileSync(path, "utf8");
}

function collectTestContents(directory: string, fromIndex: boolean): string[] {
  if (!existsSync(directory)) {
    return [];
  }
  const contents: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "node_modules" && entry !== "dist") {
        contents.push(...collectTestContents(path, fromIndex));
      }
      continue;
    }
    if (TEST_FILE_PATTERN.test(entry)) {
      const content = readSnapshotFile(path, fromIndex);
      if (content !== undefined) {
        contents.push(content);
      }
    }
  }
  return contents;
}

const stagedPaths = collectStagedPaths();
const fromIndex = stagedPaths.length > 0;
const afterChecklist = fromIndex
  ? (readIndexFile(CHECKLIST_REL) ?? "")
  : readFileSync(CHECKLIST, "utf8");

const violations = validateProgress({
  beforeChecklist: readHeadChecklist(),
  afterChecklist,
  changedPaths: fromIndex ? stagedPaths : collectChangedPaths(),
  specs: collectProgressSpecs(fromIndex),
  testContents: ["apps", "packages", "scripts"].flatMap((directory) =>
    collectTestContents(join(ROOT, directory), fromIndex)
  ),
});

if (violations.length > 0) {
  process.stderr.write(`❌ check:progress — ${violations.length} lỗi\n`);
  for (const violation of violations) {
    process.stderr.write(`  [${violation.code}] ${violation.message}\n`);
  }
  process.exit(1);
}

process.stdout.write("✅ check:progress — tiến độ có bằng chứng\n");
