/**
 * Cổng HINT TARGET RATCHET — Đo số template chưa cài `getHintTargetIndex` thật.
 *
 *   pnpm check:hint-target             # Đối chiếu baseline
 *   pnpm check:hint-target --update    # Cập nhật baseline khi nợ giảm
 *
 * `core.tickScaffolding` chỉ vẽ vòng hổ phách khi session trả về một index.
 * Mặc định của `TemplateGameSession.getHintTargetIndex()` là `null` (thà không
 * gợi ý còn hơn gợi ý sai), nên một template quên cài KHÔNG làm test nào đỏ —
 * nó chỉ âm thầm không bao giờ chỉ chỗ cho trẻ.
 *
 * Phép đo: template phải override `getHintTargetIndex`, và thân hàm Cấm — NEVER
 * chỉ có đúng một câu `return null;` (đó là stub, không phải cài đặt).
 * Nợ chỉ được giảm; `--update` từ chối ghi khi nợ tăng (cần `--force`).
 */

import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { extractBlock } from "./check-logic-space.ts";

export interface HintTargetBaseline {
  max_missing_hint_target: number;
}

export interface HintTargetViolation {
  readonly template: string;
  readonly kind: "missing" | "stub";
}

const DEFAULT_TEMPLATES_DIR = path.join(
  REPO_ROOT,
  "packages/game-engine/src/templates"
);
const BASELINE_PATH = path.join(REPO_ROOT, "scripts/hint-target-baseline.json");
const MARKER = "getHintTargetIndex";

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

function main(): void {
  const args = process.argv.slice(2);
  const isUpdate = args.includes("--update");
  const isForce = args.includes("--force");
  const violations = findViolations();
  const currentCount = violations.length;

  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Không tìm thấy baseline file: ${BASELINE_PATH}`);
  }
  const baseline = JSON.parse(
    fs.readFileSync(BASELINE_PATH, "utf8")
  ) as HintTargetBaseline;
  const allowedMax = baseline.max_missing_hint_target;

  if (isUpdate) {
    if (currentCount > allowedMax && !isForce) {
      console.error(
        `\n✗ Từ chối nới baseline: nợ ${currentCount} > baseline ${allowedMax}.`
      );
      process.exit(1);
    }
    fs.writeFileSync(
      BASELINE_PATH,
      `${JSON.stringify({ max_missing_hint_target: currentCount }, null, 2)}\n`,
      "utf8"
    );
    console.log(
      `✅ Đã cập nhật hint-target-baseline.json: ${currentCount} template thiếu.`
    );
    process.exit(0);
  }

  console.log("\n📊 Kết quả kiểm tra Hint Target Ratchet:");
  console.log(`   - Template chưa cài thật: ${currentCount}`);
  console.log(`   - Ngưỡng baseline: ${allowedMax}`);

  if (currentCount > allowedMax) {
    console.error(
      `\n✗ Hint Target Ratchet THẤT BẠI: ${currentCount} vượt ngưỡng ${allowedMax}!`
    );
    for (const v of violations) {
      console.error(
        `    • ${v.template}: ${v.kind === "missing" ? "không override getHintTargetIndex" : "thân hàm chỉ có `return null;`"}`
      );
    }
    process.exit(1);
  }

  console.log(`\n✅ Cổng xanh: ${currentCount}/${allowedMax}.`);
}

if (process.argv[1]?.includes("check-hint-target")) {
  main();
}
