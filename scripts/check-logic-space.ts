/**
 * Cổng LOGIC SPACE RATCHET — Đo số chỗ trong `computeSlots` chưa dùng không gian
 * logic động (`this.logicSpace`).
 *
 *   pnpm check:logic-space             # Chạy kiểm tra đối chiếu baseline
 *   pnpm check:logic-space --update    # Cập nhật baseline khi nợ giảm
 *
 * Phép đo (Task #260 I7): quét ĐÚNG thân `computeSlots`, không quét cả file.
 *  - Mỗi `LayoutInput` (nhận ra qua khoá `slotCount:`) phải có `logic:`.
 *  - Thân tự dựng mảng slot phải tham chiếu `this.logicSpace`.
 * Quét cả file cho phép một template truyền `logic:` ở một chỗ rồi bỏ ở chỗ
 * khác mà cổng vẫn xanh — đó là phép đo cho 0 giả.
 *
 * Nợ chỉ được giảm. `--update` từ chối ghi khi nợ tăng.
 */

import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

export interface LogicSpaceBaseline {
  max_missing_logic_space: number;
}

export interface LogicSpaceViolation {
  readonly template: string;
  readonly kind: "layout_input_without_logic" | "body_without_logic_space";
  readonly detail: string;
}

const DEFAULT_TEMPLATES_DIR = path.join(
  REPO_ROOT,
  "packages/game-engine/src/templates"
);
const BASELINE_PATH = path.join(REPO_ROOT, "scripts/logic-space-baseline.json");
const COMPUTE_SLOTS_MARKER = "computeSlots(";

/** Cắt thân một hàm bằng cách khớp ngoặc, trả về "" khi không tìm thấy. */
export function extractBlock(source: string, marker: string): string {
  const start = source.indexOf(marker);
  if (start < 0) {
    return "";
  }
  let depth = 0;
  let opened = false;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === "{") {
      depth += 1;
      opened = true;
    } else if (char === "}") {
      depth -= 1;
      if (opened && depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  return source.slice(start);
}

/** Cắt object literal bao quanh vị trí `index`. */
function enclosingObjectLiteral(body: string, index: number): string {
  let start = index;
  let depth = 0;
  for (let i = index; i >= 0; i--) {
    const char = body[i];
    if (char === "}") {
      depth += 1;
    } else if (char === "{") {
      if (depth === 0) {
        start = i;
        break;
      }
      depth -= 1;
    }
  }
  return extractBlock(body.slice(start), "{");
}

export function findViolationsInSource(
  templateName: string,
  source: string
): LogicSpaceViolation[] {
  const body = extractBlock(source, COMPUTE_SLOTS_MARKER);
  if (!body) {
    return [];
  }

  const violations: LogicSpaceViolation[] = [];

  let searchFrom = 0;
  let layoutInputCount = 0;
  while (true) {
    const at = body.indexOf("slotCount:", searchFrom);
    if (at < 0) {
      break;
    }
    layoutInputCount += 1;
    const literal = enclosingObjectLiteral(body, at);
    if (!literal.includes("logic:")) {
      violations.push({
        template: templateName,
        kind: "layout_input_without_logic",
        detail: `LayoutInput thứ ${layoutInputCount} không truyền \`logic:\``,
      });
    }
    searchFrom = at + "slotCount:".length;
  }

  if (layoutInputCount === 0 && !body.includes("this.logicSpace")) {
    violations.push({
      template: templateName,
      kind: "body_without_logic_space",
      detail: "thân computeSlots không tham chiếu `this.logicSpace`",
    });
  }

  return violations;
}

export function findViolations(
  templatesDir: string = DEFAULT_TEMPLATES_DIR
): LogicSpaceViolation[] {
  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Không tìm thấy thư mục templates: ${templatesDir}`);
  }

  const violations: LogicSpaceViolation[] = [];
  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!(entry.isDirectory() && entry.name.startsWith("GT-"))) {
      continue;
    }
    const sessionPath = path.join(templatesDir, entry.name, "session.ts");
    if (!fs.existsSync(sessionPath)) {
      continue;
    }
    violations.push(
      ...findViolationsInSource(
        entry.name,
        fs.readFileSync(sessionPath, "utf8")
      )
    );
  }

  return violations.sort((a, b) => a.template.localeCompare(b.template));
}

function readBaseline(): LogicSpaceBaseline {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Không tìm thấy baseline file: ${BASELINE_PATH}`);
  }
  return JSON.parse(
    fs.readFileSync(BASELINE_PATH, "utf8")
  ) as LogicSpaceBaseline;
}

function writeBaseline(count: number): void {
  const data: LogicSpaceBaseline = { max_missing_logic_space: count };
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(
    `✅ Đã cập nhật logic-space-baseline.json: max_missing_logic_space = ${count}`
  );
}

function printViolations(violations: readonly LogicSpaceViolation[]): void {
  for (const v of violations) {
    console.error(`    • ${v.template}: ${v.detail}`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const isUpdate = args.includes("--update");
  const isForce = args.includes("--force");
  const violations = findViolations();
  const currentCount = violations.length;
  const baseline = readBaseline();
  const allowedMax = baseline.max_missing_logic_space;

  if (isUpdate) {
    // Ratchet chỉ được siết. Nới ngưỡng phải là quyết định có chủ ý (--force).
    if (currentCount > allowedMax && !isForce) {
      console.error(
        `\n✗ Từ chối nới baseline: nợ hiện tại ${currentCount} > baseline ${allowedMax}.`
      );
      printViolations(violations);
      console.error(
        "  Sửa vi phạm, hoặc chạy lại với --force nếu thật sự muốn nới."
      );
      process.exit(1);
    }
    writeBaseline(currentCount);
    process.exit(0);
  }

  console.log("\n📊 Kết quả kiểm tra Logic Space Ratchet:");
  console.log(`   - Số vi phạm hiện tại: ${currentCount}`);
  console.log(`   - Ngưỡng baseline tối đa cho phép: ${allowedMax}`);

  if (currentCount > allowedMax) {
    console.error(
      `\n✗ Logic Space Ratchet THẤT BẠI: ${currentCount} vi phạm, vượt ngưỡng ${allowedMax}!`
    );
    printViolations(violations);
    process.exit(1);
  }

  if (currentCount < allowedMax) {
    console.log(
      `\n🎉 Tiến bộ! Nợ giảm từ ${allowedMax} xuống ${currentCount}. Chạy 'pnpm check:logic-space:update'.`
    );
  } else {
    console.log(`\n✅ Cổng xanh: ${currentCount}/${allowedMax}.`);
  }
}

if (process.argv[1]?.includes("check-logic-space")) {
  main();
}
