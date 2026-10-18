/**
 * Cổng HINT TARGET RATCHET — Đo số template chưa cài `getHintTargetIndex` thật
 * và số template chưa tách bậc thang gợi ý `getHintTargetForLevel` (Task #301 S3).
 *
 *   pnpm check:hint-target             # Đối chiếu baseline
 *   pnpm check:hint-target --update    # Cập nhật baseline khi nợ giảm
 *
 * Phép đo 1 (`max_missing_hint_target`): template phải override `getHintTargetIndex`,
 * và thân hàm Cấm — NEVER chỉ có đúng một câu `return null;`.
 * Phép đo 2 (`max_missing_hint_ladder`): template phải cài `getHintTargetForLevel`
 * (hoặc đăng ký trong `EXTERNAL_HINT_LADDER_TEMPLATES`) và ở `L1` Cấm — NEVER trả
 * thẳng slot đáp án (`kind: "slot"` / `this.getHintTarget()`).
 */

import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { extractBlock } from "./check-logic-space.ts";

export interface HintTargetBaseline {
  max_missing_hint_target: number;
  max_missing_hint_ladder?: number;
}

export interface HintTargetViolation {
  readonly template: string;
  readonly kind: "missing" | "stub";
}

export interface HintLadderViolation {
  readonly template: string;
  readonly kind: "missing_ladder" | "l1_leaks_answer";
}

const DEFAULT_TEMPLATES_DIR = path.join(
  REPO_ROOT,
  "packages/game-engine/src/templates"
);
const BASELINE_PATH = path.join(REPO_ROOT, "scripts/hint-target-baseline.json");
const MARKER = "getHintTargetIndex";
const LADDER_MARKER = "getHintTargetForLevel";

const LEVEL_1_BRANCH_REGEX = /level\s*===\s*1|case\s+1\s*:/;
const LEVEL_2_BRANCH_REGEX = /level\s*===\s*2|case\s+2\s*:/;
const KIND_SLOT_REGEX = /kind\s*:\s*["']slot["']/;
const GET_HINT_TARGET_CALL_REGEX = /this\.getHintTarget\s*\(/;
const GET_HINT_TARGET_INDEX_CALL_REGEX = /this\.getHintTargetIndex\s*\(/;

/**
 * Các template cài bậc thang gợi ý ở tầng hệ thống (`systems/hint-ladder.ts`)
 * để không chạm trực tiếp `session.ts`.
 */
const DEFAULT_EXTERNAL_LADDER_TEMPLATES: readonly string[] = [
  "GT-032",
] as const;

export function findViolationInSource(
  templateName: string,
  source: string
): HintTargetViolation | null {
  if (!source.includes(MARKER)) {
    return { template: templateName, kind: "missing" };
  }

  const block = extractBlock(source, MARKER);
  const inner = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
  const statements = inner
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 && !(line.startsWith("//") || line.startsWith("*"))
    );

  if (statements.length === 1 && statements[0] === "return null;") {
    return { template: templateName, kind: "stub" };
  }

  return null;
}

function extractLevel1Branch(inner: string): string | null {
  const l1MarkerIdx = inner.search(LEVEL_1_BRANCH_REGEX);
  if (l1MarkerIdx < 0) {
    return null;
  }
  const fromL1 = inner.slice(l1MarkerIdx);
  const openBrace = fromL1.indexOf("{");
  if (openBrace >= 0) {
    return extractBlock(fromL1, fromL1.slice(0, openBrace + 1));
  }
  const l2Idx = fromL1.search(LEVEL_2_BRANCH_REGEX);
  return l2Idx >= 0 ? fromL1.slice(0, l2Idx) : fromL1;
}

export function findLadderViolationInSource(
  templateName: string,
  source: string,
  externalTemplates: readonly string[] = []
): HintLadderViolation | null {
  if (!source.includes(LADDER_MARKER)) {
    if (externalTemplates.includes(templateName)) {
      return null;
    }
    return { template: templateName, kind: "missing_ladder" };
  }

  const block = extractBlock(source, LADDER_MARKER);
  const inner = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
  const l1Branch = extractLevel1Branch(inner);
  if (!l1Branch) {
    return { template: templateName, kind: "l1_leaks_answer" };
  }

  const leaksSlot =
    KIND_SLOT_REGEX.test(l1Branch) ||
    GET_HINT_TARGET_CALL_REGEX.test(l1Branch) ||
    GET_HINT_TARGET_INDEX_CALL_REGEX.test(l1Branch);

  if (leaksSlot) {
    return { template: templateName, kind: "l1_leaks_answer" };
  }

  return null;
}

export function findViolations(
  templatesDir: string = DEFAULT_TEMPLATES_DIR
): HintTargetViolation[] {
  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Không tìm thấy thư mục templates: ${templatesDir}`);
  }

  const violations: HintTargetViolation[] = [];
  for (const entry of fs.readdirSync(templatesDir, { withFileTypes: true })) {
    if (!(entry.isDirectory() && entry.name.startsWith("GT-"))) {
      continue;
    }
    const sessionPath = path.join(templatesDir, entry.name, "session.ts");
    if (!fs.existsSync(sessionPath)) {
      continue;
    }
    const violation = findViolationInSource(
      entry.name,
      fs.readFileSync(sessionPath, "utf8")
    );
    if (violation) {
      violations.push(violation);
    }
  }

  return violations.sort((a, b) => a.template.localeCompare(b.template));
}

export function findLadderViolations(
  templatesDir: string = DEFAULT_TEMPLATES_DIR,
  externalTemplates: readonly string[] = DEFAULT_EXTERNAL_LADDER_TEMPLATES
): HintLadderViolation[] {
  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Không tìm thấy thư mục templates: ${templatesDir}`);
  }

  const violations: HintLadderViolation[] = [];
  for (const entry of fs.readdirSync(templatesDir, { withFileTypes: true })) {
    if (!(entry.isDirectory() && entry.name.startsWith("GT-"))) {
      continue;
    }
    const sessionPath = path.join(templatesDir, entry.name, "session.ts");
    if (!fs.existsSync(sessionPath)) {
      continue;
    }
    const violation = findLadderViolationInSource(
      entry.name,
      fs.readFileSync(sessionPath, "utf8"),
      externalTemplates
    );
    if (violation) {
      violations.push(violation);
    }
  }

  return violations.sort((a, b) => a.template.localeCompare(b.template));
}

function reportViolationsAndExit(
  violations: readonly HintTargetViolation[],
  ladderViolations: readonly HintLadderViolation[],
  allowedMax: number,
  allowedLadderMax: number
): never {
  console.error(
    `\n✗ Hint Target Ratchet THẤT BẠI: target ${violations.length}/${allowedMax}, ladder ${ladderViolations.length}/${allowedLadderMax}!`
  );
  for (const v of violations) {
    const desc =
      v.kind === "missing"
        ? "không override getHintTargetIndex"
        : "thân hàm chỉ có `return null;`";
    console.error(`    • ${v.template}: ${desc}`);
  }
  for (const v of ladderViolations) {
    const desc =
      v.kind === "missing_ladder"
        ? "chưa cài getHintTargetForLevel"
        : "L1 trả thẳng slot đáp án";
    console.error(`    • ${v.template}: ${desc}`);
  }
  process.exit(1);
}

function handleBaselineUpdate(
  currentCount: number,
  currentLadderCount: number,
  allowedMax: number,
  allowedLadderMax: number,
  isForce: boolean
): never {
  const exceeds =
    currentCount > allowedMax || currentLadderCount > allowedLadderMax;
  if (exceeds && !isForce) {
    console.error(
      `\n✗ Từ chối nới baseline: nợ target ${currentCount}/${allowedMax}, ladder ${currentLadderCount}/${allowedLadderMax}.`
    );
    process.exit(1);
  }
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(
      {
        max_missing_hint_target: currentCount,
        max_missing_hint_ladder: currentLadderCount,
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  console.log(
    `✅ Đã cập nhật hint-target-baseline.json: target=${currentCount}, ladder=${currentLadderCount}.`
  );
  process.exit(0);
}

function main(): void {
  const args = process.argv.slice(2);
  const violations = findViolations();
  const ladderViolations = findLadderViolations();
  const currentCount = violations.length;
  const currentLadderCount = ladderViolations.length;

  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Không tìm thấy baseline file: ${BASELINE_PATH}`);
  }
  const baseline = JSON.parse(
    fs.readFileSync(BASELINE_PATH, "utf8")
  ) as HintTargetBaseline;
  const allowedMax = baseline.max_missing_hint_target;
  const allowedLadderMax = baseline.max_missing_hint_ladder ?? 38;

  if (args.includes("--update")) {
    handleBaselineUpdate(
      currentCount,
      currentLadderCount,
      allowedMax,
      allowedLadderMax,
      args.includes("--force")
    );
  }

  console.log("\n📊 Kết quả kiểm tra Hint Target Ratchet:");
  console.log(
    `   - Template chưa cài getHintTargetIndex: ${currentCount}/${allowedMax}`
  );
  console.log(
    `   - Template chưa tách bậc thang L1/L2/L3: ${currentLadderCount}/${allowedLadderMax}`
  );

  if (currentCount > allowedMax || currentLadderCount > allowedLadderMax) {
    reportViolationsAndExit(
      violations,
      ladderViolations,
      allowedMax,
      allowedLadderMax
    );
  }

  console.log(
    `\n✅ Cổng xanh: target ${currentCount}/${allowedMax}, ladder ${currentLadderCount}/${allowedLadderMax}.`
  );
}

if (process.argv[1]?.includes("check-hint-target")) {
  main();
}
