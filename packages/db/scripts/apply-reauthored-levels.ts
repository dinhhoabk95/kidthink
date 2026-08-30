/**
 * Ghi 73 level đã soạn lại (`seed-content/reauthored/authoring.ts`) đè lên hạt
 * giống gốc trong `seed-content/c1..c6`.
 *
 * Giữ nguyên phần đầu của hạt — mã, kỹ năng, LO, tag, band tuổi, gói, độ khó,
 * xuất xứ — và chỉ thay `template_code`, `content_pack`, `difficulty_params`,
 * cộng `title`/`instruction` khi bảng soạn lại khai chúng.
 *
 * Cùng cách làm với codemod hợp đồng: nạp **giá trị runtime** của mảng đã
 * export rồi phát lại nguyên khối literal, không regex trên nguồn.
 */
import fs from "node:fs";
import path from "node:path";
import { REAUTHORED_LEVELS } from "#src/seed-content/reauthored/authoring";

const SEED_ROOT = path.resolve(import.meta.dirname, "../src/seed-content");
const COMPETENCY_DIR_REGEX = /^c[1-6]$/;
const ARRAY_EXPORT_REGEX =
  /^export const ([A-Z0-9_]+): ContentSeed<unknown, unknown>\[\] = \[$/;

interface SeedHeader {
  code: string;
  template_code: string;
  title: string;
  instruction: string;
  [k: string]: unknown;
}
interface Seed {
  header: SeedHeader;
  content_pack: unknown;
  difficulty_params: unknown;
  [k: string]: unknown;
}

function seedArrayExport(file: string): string | null {
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    const match = ARRAY_EXPORT_REGEX.exec(line);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function competencyFiles(): string[] {
  const files: string[] = [];
  for (const dir of fs.readdirSync(SEED_ROOT).sort()) {
    const dirPath = path.join(SEED_ROOT, dir);
    if (!COMPETENCY_DIR_REGEX.test(dir)) {
      continue;
    }
    if (!fs.statSync(dirPath).isDirectory()) {
      continue;
    }
    for (const name of fs.readdirSync(dirPath).sort()) {
      if (name.endsWith(".ts")) {
        files.push(path.join(dirPath, name));
      }
    }
  }
  return files;
}

function discoverTargets(): Array<{ file: string; exportName: string }> {
  const targets: Array<{ file: string; exportName: string }> = [];
  for (const file of competencyFiles()) {
    const exportName = seedArrayExport(file);
    if (exportName) {
      targets.push({ file, exportName });
    }
  }
  return targets;
}

function applyToSeed(seed: Seed): Seed | null {
  const pack = REAUTHORED_LEVELS[seed.header.code];
  if (!pack) {
    return null;
  }
  return {
    ...seed,
    header: {
      ...seed.header,
      template_code: pack.template_code,
      title: pack.title ?? seed.header.title,
      instruction: pack.instruction ?? seed.header.instruction,
    },
    content_pack: pack.content_pack,
    difficulty_params: pack.difficulty_params,
  };
}

function rewriteArrayLiteral(
  filePath: string,
  exportName: string,
  value: unknown[]
): void {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const startIdx = lines.findIndex((line) =>
    line.startsWith(`export const ${exportName}`)
  );
  const endIdx = lines.findIndex((line, i) => i > startIdx && line === "];");
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      `Không thấy khối literal của ${exportName} trong ${filePath}`
    );
  }
  const body = JSON.stringify(value, null, 2)
    .split("\n")
    .slice(1, -1)
    .join("\n");
  const next = [
    ...lines.slice(0, startIdx),
    lines[startIdx] as string,
    body,
    "];",
    ...lines.slice(endIdx + 1),
  ];
  fs.writeFileSync(filePath, next.join("\n"), "utf-8");
}

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  let applied = 0;

  for (const target of discoverTargets()) {
    const mod = (await import(target.file)) as Record<string, unknown>;
    const seeds = mod[target.exportName];
    if (!Array.isArray(seeds)) {
      throw new Error(`${target.exportName} không phải mảng`);
    }
    let fileHits = 0;
    const next = (seeds as Seed[]).map((seed) => {
      const replaced = applyToSeed(seed);
      if (replaced) {
        fileHits++;
        applied++;
        return replaced;
      }
      return seed;
    });
    if (fileHits === 0) {
      continue;
    }
    console.log(
      `${path.relative(SEED_ROOT, target.file).padEnd(28)} ${target.exportName.padEnd(18)} ${fileHits}`
    );
    if (write) {
      rewriteArrayLiteral(target.file, target.exportName, next);
    }
  }

  const total = Object.keys(REAUTHORED_LEVELS).length;
  console.log(`\nghi đè ${applied}/${total} level đã soạn lại`);
  if (applied !== total) {
    throw new Error(
      `Còn ${total - applied} mã trong bảng soạn lại không tìm thấy trong corpus.`
    );
  }
  console.log(write ? "✅ đã ghi" : "ℹ️  thêm --write để ghi");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
