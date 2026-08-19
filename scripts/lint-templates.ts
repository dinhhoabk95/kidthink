#!/usr/bin/env node
import { resolve } from "node:path";
import { scanAllTemplateGates } from "./lint-templates-lib.js";

const rootDir = process.cwd();
const gameEngineDir = resolve(rootDir, "packages", "game-engine");

const violations = scanAllTemplateGates(gameEngineDir);

if (violations.length === 0) {
  console.log(
    "✅ [lint:templates] All template authoring kit rules passed cleanly (BR-TAK-01..14)."
  );
  process.exit(0);
} else {
  console.error(`❌ [lint:templates] Found ${violations.length} violations:`);
  for (const v of violations) {
    console.error(
      `  - [${v.rule}] ${v.templateCode ? `(${v.templateCode}) ` : ""}${v.message}`
    );
  }
  process.exit(1);
}
