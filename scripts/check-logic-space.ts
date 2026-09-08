/**
 * Cổng LOGIC SPACE RATCHET — Đo số lượng template game engine chưa truyền `this.logicSpace` vào layout.
 *
 *   pnpm check:logic-space             # Chạy kiểm tra đối chiếu baseline
 *   pnpm check:logic-space --update    # Cập nhật baseline khi số nợ giảm
 *
 * Nợ chỉ được giảm: nợ nền ban đầu = 32.
 * Mục tiêu Task #260: đốt nợ về 0.
 */

import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

interface LogicSpaceBaseline {
  max_missing_logic_space: number;
}

const TEMPLATES_DIR = path.join(
  REPO_ROOT,
  "packages/game-engine/src/templates"
);
const BASELINE_PATH = path.join(REPO_ROOT, "scripts/logic-space-baseline.json");

function parseArgs(): boolean {
  return process.argv.slice(2).includes("--update");
}

function findMissingTemplates(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    throw new Error(`Không tìm thấy thư mục templates: ${TEMPLATES_DIR}`);
  }

  const entries = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });
  const missing: string[] = [];

  for (const entry of entries) {
    if (!(entry.isDirectory() && entry.name.startsWith("GT-"))) {
      continue;
    }

    const sessionPath = path.join(TEMPLATES_DIR, entry.name, "session.ts");
    if (!fs.existsSync(sessionPath)) {
      continue;
    }

    const content = fs.readFileSync(sessionPath, "utf8");
    if (!content.includes("computeSlots")) {
      continue;
    }

    // Kiểm tra xem computeSlots có sử dụng this.logicSpace hay không
    const computeSlotsIndex = content.indexOf("computeSlots");
    const afterComputeSlots = content.slice(computeSlotsIndex);

    const hasLogicSpace =
      afterComputeSlots.includes("this.logicSpace") ||
      content.includes("logic: this.logicSpace");

    if (!hasLogicSpace) {
      missing.push(entry.name);
    }
  }

  return missing.sort();
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

function main(): void {
  const isUpdate = parseArgs();
  const missingTemplates = findMissingTemplates();
  const currentCount = missingTemplates.length;

  if (isUpdate) {
    writeBaseline(currentCount);
    process.exit(0);
  }

  const baseline = readBaseline();
  const allowedMax = baseline.max_missing_logic_space;

  console.log("\n📊 Kết quả kiểm tra Logic Space Ratchet:");
  console.log(`   - Số template chưa truyền logicSpace: ${currentCount}`);
  console.log(`   - Ngưỡng baseline tối đa cho phép: ${allowedMax}`);

  if (currentCount > allowedMax) {
    console.error(
      `\n✗ Logic Space Ratchet THẤT BẠI: Số template thiếu (${currentCount}) vượt ngưỡng baseline (${allowedMax})!`
    );
    console.error("  Danh sách các template thiếu logicSpace:");
    for (const name of missingTemplates) {
      console.error(`    • ${name}`);
    }
    process.exit(1);
  }

  if (currentCount < allowedMax) {
    console.log(
      `\n🎉 Tiến bộ! Số template thiếu logicSpace đã giảm từ ${allowedMax} xuống ${currentCount}.`
    );
    console.log(
      "   Hãy chạy 'pnpm check:logic-space:update' để hạ ngưỡng baseline."
    );
  } else {
    console.log(
      `\n✅ Cổng xanh: Đạt yêu cầu baseline (${currentCount}/${allowedMax}).`
    );
  }
}

main();
