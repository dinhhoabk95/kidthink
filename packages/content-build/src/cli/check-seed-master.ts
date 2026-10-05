#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import {
  formatSeedMasterViolation,
  type SeedMasterSource,
  scanSeedMaster,
} from "../gates/seed-master-scan.js";

const SEED_MASTER_DIR = "packages/content-build/src/seed-master";

function collectSources(dir: string): SeedMasterSource[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectSources(full);
    }
    return entry.name.endsWith(".ts")
      ? [
          {
            path: path.relative(repoPath("."), full),
            source: fs.readFileSync(full, "utf8"),
          },
        ]
      : [];
  });
}

export function runSeedMasterScan(): number {
  const violations = scanSeedMaster(collectSources(repoPath(SEED_MASTER_DIR)));
  if (violations.length === 0) {
    console.log(
      "✅ seed-master không chọn nội dung bằng phép chia lấy dư, LIMIT hay thứ tự id"
    );
    return 0;
  }
  console.error("❌ seed-master còn phép gán nội dung kiểu cũ:");
  for (const violation of violations) {
    console.error(`  - ${formatSeedMasterViolation(violation)}`);
  }
  return 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runSeedMasterScan());
}
