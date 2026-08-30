/**
 * Trả mã workbook Montessori (`WB01-D1`) về corpus — lần này là **dữ liệu**.
 *
 * Trước task 162 mã này chỉ sống trong comment `// WB01-D1 Level 2 …`, và
 * `tests/gates/montessori-corpus.ts` quét văn bản thô của file để đếm. Codemod
 * hợp đồng phát lại khối literal từ giá trị runtime nên comment biến mất và
 * cổng đếm được 14 dạng bài thay vì 24.
 *
 * Comment là chỗ sai để giữ một con số có cổng canh. Mã giờ nằm ở
 * `header.montessori_ref`; nguồn khôi phục là bản sao lưu trước codemod.
 */
import fs from "node:fs";
import path from "node:path";

const WB_COMMENT_REGEX = /^\s*\/\/\s*(WB\d{2}-D\d)\b/;
const CODE_LINE_REGEX = /code:\s*"(GL-[A-Z0-9-]+)"/;
const JSON_CODE_LINE_REGEX = /"code":\s*"(GL-[A-Z0-9-]+)"/;
const COMPETENCY_DIR_REGEX = /^c[1-6]$/;
const MONT_FILE_PREFIX = "seed-mont-";

function montessoriFiles(root: string): string[] {
  const files: string[] = [];
  for (const dir of fs.readdirSync(root)) {
    const dirPath = path.join(root, dir);
    if (!COMPETENCY_DIR_REGEX.test(dir)) {
      continue;
    }
    if (!fs.statSync(dirPath).isDirectory()) {
      continue;
    }
    for (const file of fs.readdirSync(dirPath)) {
      if (file.startsWith(MONT_FILE_PREFIX)) {
        files.push(path.join(dirPath, file));
      }
    }
  }
  return files.sort();
}

function collectRefsFromFile(filePath: string, map: Map<string, string>): void {
  let current: string | null = null;
  for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
    const comment = WB_COMMENT_REGEX.exec(line);
    if (comment?.[1]) {
      current = comment[1];
      continue;
    }
    const code = CODE_LINE_REGEX.exec(line);
    if (code?.[1] && current) {
      map.set(code[1], current);
    }
  }
}

/** Đọc bản sao lưu: mã level → mã workbook của comment gần nhất phía trên. */
function buildRefMap(backupDir: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of montessoriFiles(backupDir)) {
    collectRefsFromFile(file, map);
  }
  return map;
}

function injectRefs(
  filePath: string,
  refMap: Map<string, string>
): { text: string; hits: number } {
  const out: string[] = [];
  let hits = 0;
  for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
    out.push(line);
    const code =
      JSON_CODE_LINE_REGEX.exec(line)?.[1] ?? CODE_LINE_REGEX.exec(line)?.[1];
    const ref = code ? refMap.get(code) : undefined;
    if (!ref) {
      continue;
    }
    const indent = line.slice(0, line.length - line.trimStart().length);
    out.push(`${indent}"montessori_ref": "${ref}",`);
    hits++;
  }
  return { text: out.join("\n"), hits };
}

function main(): void {
  const backupDir = process.argv
    .find((arg) => arg.startsWith("--backup="))
    ?.slice("--backup=".length);
  if (!backupDir) {
    throw new Error("Thiếu --backup=<đường dẫn seed-content trước codemod>");
  }
  const write = process.argv.includes("--write");
  const refMap = buildRefMap(backupDir);
  console.log(`bản sao lưu cho ${refMap.size} mã level`);

  const root = path.resolve(import.meta.dirname, "../src/seed-content");
  let injected = 0;

  for (const full of montessoriFiles(root)) {
    const { text, hits } = injectRefs(full, refMap);
    injected += hits;
    if (hits === 0) {
      continue;
    }
    console.log(`${path.relative(root, full).padEnd(30)} +${hits}`);
    if (write) {
      fs.writeFileSync(full, text, "utf-8");
    }
  }
  console.log(`\n${injected} mã workbook gắn lại`);
  console.log(write ? "✅ đã ghi" : "ℹ️  thêm --write để ghi");
}

main();
