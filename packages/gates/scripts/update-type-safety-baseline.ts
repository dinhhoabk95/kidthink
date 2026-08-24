/**
 * Hạ baseline nợ ép kiểu (`BR-TYP-02`, `BR-TYP-08`) sau khi đã giảm thật.
 *
 * Cổng nằm ở `tests/type-safety.test.ts` — nó chỉ **đọc** baseline. File này là
 * cách duy nhất **ghi** baseline, và ❌ NEVER được gọi tự động: hạ baseline là
 * quyết định của người, không phải hệ quả của một lần chạy test.
 *
 *   node packages/gates/scripts/update-type-safety-baseline.ts
 */
import {
  readBaseline,
  scanRepo,
  total,
  writeBaseline,
} from "#src/lint-type-safety";

const before = readBaseline();
const current = scanRepo();

writeBaseline(current);

process.stdout.write(
  `✅ baseline type-safety: ép kiểu ${total(before.casts)} → ${total(current.casts)}, ` +
    `any trong test ${total(before.testAny)} → ${total(current.testAny)}\n`
);
