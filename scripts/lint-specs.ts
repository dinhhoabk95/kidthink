/**
 * lint:specs — kiểm corpus specification theo CONVENTIONS.md §10.
 *
 * SPEC.md §7: một trong năm bước của `pnpm check`.
 * Logic 15 check ở ./lint-specs-lib.ts (importable, test được). File này chỉ
 * lo phần CLI: collect file thật, chạy check, in kết quả, exit code.
 * Exit 1 nếu có bất kỳ vi phạm nào.
 */

import {
  ALL_CHECKS,
  collectSpecFiles,
  getViolations,
  getWarnings,
} from "./lint-specs-lib.ts";

const specs = collectSpecFiles();

for (const check of ALL_CHECKS) {
  check(specs);
}

const violations = getViolations();
const warnings = getWarnings();

// Print warnings (non-blocking)
if (warnings.length > 0) {
  const sorted = [...warnings].sort(
    (a, b) =>
      a.check.localeCompare(b.check) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line
  );
  console.warn(`⚠️  ${warnings.length} warning(s):\n`);
  for (const w of sorted) {
    console.warn(`  ${w.file}:${w.line}  [${w.check}]  ${w.message}`);
  }
  console.warn();
}

if (violations.length === 0) {
  console.log(
    `✅ lint:specs — ${specs.length} specs, ${ALL_CHECKS.length} checks, 0 errors${warnings.length > 0 ? `, ${warnings.length} warnings` : ""}`
  );
  process.exit(0);
} else {
  console.error(`❌ lint:specs — ${violations.length} error(s):\n`);
  const sorted = [...violations].sort(
    (a, b) =>
      a.check.localeCompare(b.check) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line
  );
  for (const v of sorted) {
    console.error(`  ${v.file}:${v.line}  [${v.check}]  ${v.message}`);
  }
  console.error();
  process.exit(1);
}
