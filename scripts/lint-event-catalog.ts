#!/usr/bin/env node
import { resolve } from "node:path";
import { scanEventCatalogGates } from "./lint-event-catalog-lib.js";

const rootDir = process.cwd();
const violations = scanEventCatalogGates({
  specFile: resolve(rootDir, "docs/specs/00-foundation/event-catalog.md"),
  playSessionFile: resolve(rootDir, "packages/db/src/services/play-session.ts"),
  templatesDir: resolve(rootDir, "packages/game-engine/src/templates"),
});

if (violations.length === 0) {
  console.log(
    "✅ [lint:events] Catalog, ALLOWED_EVENT_NAMES và events của khuôn khớp nhau (BR-EVT-01, BR-EVT-07)."
  );
  process.exit(0);
}

console.error(`❌ [lint:events] Tìm thấy ${violations.length} lệch:`);
for (const v of violations) {
  console.error(`  - [${v.rule}] (${v.source}) ${v.message}`);
}
process.exit(1);
