/**
 * Chạy codemod 162. `--write` mới ghi; mặc định chỉ báo cáo.
 */
import fs from "node:fs";
import path from "node:path";
import {
  migrateSeeds,
  reportUnmappedGlyphs,
  rewriteArrayLiteral,
  SEED_ROOT,
} from "./migrate-seed-contracts.ts";

const SEED_ARRAY_EXPORT_REGEX =
  /^export const ([A-Z0-9_]+): ContentSeed<unknown, unknown>\[\] = \[$/;

interface Target {
  file: string;
  exportName: string;
}

function discoverTargets(): Target[] {
  const targets: Target[] = [];
  for (const dir of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
    const dirPath = path.join(SEED_ROOT, dir);
    for (const name of fs.readdirSync(dirPath).sort()) {
      if (!name.endsWith(".ts")) {
        continue;
      }
      const file = path.join(dirPath, name);
      const source = fs.readFileSync(file, "utf-8");
      for (const line of source.split("\n")) {
        const match = SEED_ARRAY_EXPORT_REGEX.exec(line);
        if (match?.[1]) {
          targets.push({ file, exportName: match[1] });
          break;
        }
      }
    }
  }
  return targets;
}

function reportGlyphs(): void {
  const glyphs = reportUnmappedGlyphs();
  if (glyphs.length === 0) {
    return;
  }
  console.log(`\nGlyph không tra được mã EMJ (${glyphs.length} loại):`);
  for (const [glyph, count] of glyphs.slice(0, 30)) {
    console.log(`  ${count} × ${glyph}`);
  }
}

function reportQuarantine(entries: string[]): void {
  if (entries.length === 0) {
    return;
  }
  console.log("\nCòn cách ly:");
  const byShape = new Map<string, number>();
  for (const entry of entries) {
    const shape = entry.slice(entry.indexOf("[") + 1, -1);
    byShape.set(shape, (byShape.get(shape) ?? 0) + 1);
  }
  for (const [shape, count] of [...byShape.entries()].sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${String(count).padStart(3)} × ${shape}`);
  }
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  const targets = discoverTargets();
  let totalMigrated = 0;
  let totalValid = 0;
  const allQuarantined: string[] = [];

  for (const target of targets) {
    const mod = (await import(target.file)) as Record<string, unknown>;
    const seeds = mod[target.exportName];
    if (!Array.isArray(seeds)) {
      throw new Error(
        `${target.exportName} trong ${target.file} không phải mảng.`
      );
    }
    const outcome = migrateSeeds(seeds);
    totalMigrated += outcome.migrated;
    totalValid += outcome.alreadyValid;
    allQuarantined.push(...outcome.quarantined);

    const rel = path.relative(SEED_ROOT, target.file);
    console.log(
      `${rel.padEnd(28)} ${target.exportName.padEnd(18)} hợp lệ ${String(outcome.alreadyValid).padStart(3)} · chuyển ${String(outcome.migrated).padStart(3)} · cách ly ${String(outcome.quarantined.length).padStart(3)}`
    );

    if (write && outcome.migrated > 0) {
      rewriteArrayLiteral(target.file, target.exportName, outcome.seeds);
    }
  }

  console.log(
    `\nTổng: hợp lệ sẵn ${totalValid} · chuyển được ${totalMigrated} · cách ly ${allQuarantined.length}`
  );

  reportGlyphs();
  reportQuarantine(allQuarantined);

  if (write) {
    console.log("\n✅ đã ghi");
  } else {
    console.log("\nℹ️  chạy lại với --write để ghi");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
