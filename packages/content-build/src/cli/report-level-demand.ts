#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { SHIPPABLE_SEED_LEVELS } from "#src/catalog";
import { loadContentDemandLedger } from "#src/gates/content-demand-file";
import {
  findOrphanLevels,
  formatCoverage,
  summarizeCoverage,
} from "#src/gates/level-demand";

const ORPHAN_PREVIEW = 10;

export function runLevelDemandReport(): number {
  const ledger = loadContentDemandLedger();
  for (const line of formatCoverage(summarizeCoverage(ledger))) {
    console.log(line);
  }
  const orphans = findOrphanLevels(
    ledger,
    SHIPPABLE_SEED_LEVELS.map((level) => ({
      code: level.header.code,
      skill_codes: level.header.skill_codes,
      age_min: level.header.age_min,
      age_max: level.header.age_max,
      difficulty: level.header.difficulty,
    }))
  );
  console.log(
    `Level ngoài sổ cầu (mồ côi, giữ trong kho, không gieo vào lộ trình): ${orphans.length}`
  );
  for (const code of orphans.slice(0, ORPHAN_PREVIEW)) {
    console.log(`  - ${code}`);
  }
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runLevelDemandReport());
}
