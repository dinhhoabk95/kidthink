#!/usr/bin/env node
import { resolve } from "node:path";
import { scanMontessoriCorpusGates } from "./lint-montessori-corpus-lib.js";

const rootDir = process.cwd();
const violations = scanMontessoriCorpusGates({
  tableFile: resolve(
    rootDir,
    "docs/montessori/dataset/activity-types-table.md"
  ),
  specFile: resolve(
    rootDir,
    "docs/specs/05-content/montessori-game-level-batch.md"
  ),
  seedContentDir: resolve(rootDir, "packages/db/src/seed-content"),
});

if (violations.length === 0) {
  console.log(
    "✅ [lint:montessori-corpus] Bảng tra, mục 7.5 của spec và seeder khớp số (D-RQ, BR-MGL-01)."
  );
  process.exit(0);
}

console.error(
  `❌ [lint:montessori-corpus] Tìm thấy ${violations.length} lệch:`
);
for (const v of violations) {
  console.error(`  - [${v.rule}] (${v.source}) ${v.message}`);
}
process.exit(1);
