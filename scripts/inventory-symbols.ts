/**
 * pnpm inventory:symbols [prefix]
 *
 * Đếm ba loại nợ văn phong trên toàn bộ `docs/`, cho Task #4 —
 * docs/tasks/04-readability-spec.md mục 5.1 và docs/tasks/todo.md bước 1.
 *
 * Ba loại:
 *   - ký hiệu     — 14 ký tự cấm ở đặc tả mục 4.1 (dấu phủ định emoji, mũi tên, ...)
 *   - viết tắt    — 10 chuỗi tự phát ở đặc tả mục 4.2 (OQ, DMO, SIB, ... —
 *                   KHÔNG tính LO/ZPD/KPI, đó là thuật ngữ chuyên môn giữ nguyên)
 *   - tham chiếu trần — tên một file dưới `docs/` nằm trong dấu backtick nhưng
 *                   không nằm trong cú pháp liên kết markdown `[`tên`](đường-dẫn)`
 *
 * Quét **toàn bộ** `docs/` bằng đệ quy thư mục thật, không dùng danh sách thư
 * mục viết tay — bản nháp đầu của kế hoạch từng bỏ sót `docs/taxonomy/` vì
 * quét theo danh sách cứng. `docs/montessori/` tự động không vào kết quả vì
 * toàn file `.pdf`, glob chỉ nhận `.md`.
 *
 * Loại trừ khỏi tổng nợ (nhưng vẫn in dòng riêng, không im lặng): ba file hồ
 * sơ của chính Task #4 (`docs/tasks/{04-readability-spec,plan,todo}.md`) và
 * hai file nháp Task #5 (`docs/tasks/05-p0-spec-closure-{plan,todo}.md`).
 * Đây không phải nội dung corpus cần viết lại — ba file đầu đang **liệt kê**
 * ký hiệu bị cấm trong bảng thay thế của chính đặc tả (đối tượng được nói
 * tới, chưa bọc khối mã tới bước 20), hai file sau thuộc một task chưa bắt
 * đầu. Tính cả năm file này vào nợ sẽ đếm nhầm ví dụ minh hoạ thành vi phạm.
 *
 * Bảng ký hiệu/viết tắt và logic bỏ khối mã dùng chung với checkC14/checkC15
 * ở scripts/lint-specs-lib.ts — định nghĩa một lần ở scripts/style-guide.ts.
 */

import { resolve } from "node:path";
import {
  ABBREVIATIONS,
  buildBasenameMap,
  collectDocsFiles,
  computeSkipLines,
  countSymbolsInLine,
  type DocsFile,
  findBareRefs,
  M_CONFLICT_PATTERN,
  T_STEP_PATTERN,
} from "./style-guide.ts";

const ROOT = resolve(import.meta.dirname, "..");
const DOCS_DIR = resolve(ROOT, "docs");

const EXCLUDED_FROM_DEBT = new Set([
  "tasks/04-readability-spec.md",
  "tasks/plan.md",
  "tasks/todo.md",
  "tasks/05-p0-spec-closure-plan.md",
  "tasks/05-p0-spec-closure-todo.md",
]);

// ─── đếm ─────────────────────────────────────────────────────────────────────

interface FileCounts {
  rel: string;
  symbols: number;
  abbreviations: number;
  bareRefs: number;
  bySymbol: Map<string, number>;
  byAbbreviation: Map<string, number>;
}

function countAbbreviations(
  line: string,
  byAbbreviation: Map<string, number>,
  /** `Tn`/`Mn` chỉ có nghĩa "bước"/"mâu thuẫn" trong hồ sơ task (mục 4.2) —
   * ngoài `docs/tasks/`, "T1", "M2" là nhiễu (số liệu, tên khác) nên phải
   * tắt hai mẫu này khi quét file ngoài thư mục đó. */
  isTaskFile: boolean
): number {
  let total = 0;
  for (const abbr of ABBREVIATIONS) {
    const re = new RegExp(
      `(?<![A-Za-z0-9-])${abbr.replace("-", "\\-")}(?![A-Za-z0-9-])`,
      "g"
    );
    const matches = line.match(re);
    if (matches) {
      total += matches.length;
      byAbbreviation.set(
        abbr,
        (byAbbreviation.get(abbr) ?? 0) + matches.length
      );
    }
  }
  if (isTaskFile) {
    for (const [pattern, label] of [
      [T_STEP_PATTERN, "Tn"],
      [M_CONFLICT_PATTERN, "Mn"],
    ] as const) {
      pattern.lastIndex = 0;
      const matches = line.match(pattern);
      if (matches) {
        total += matches.length;
        byAbbreviation.set(
          label,
          (byAbbreviation.get(label) ?? 0) + matches.length
        );
      }
    }
  }
  return total;
}

function countFile(f: DocsFile, knownBasenames: Set<string>): FileCounts {
  const skip = computeSkipLines(f.lines);
  const bySymbol = new Map<string, number>();
  const byAbbreviation = new Map<string, number>();
  const isTaskFile = f.rel.startsWith("tasks/");
  let symbols = 0;
  let abbreviations = 0;
  let bareRefs = 0;

  for (let i = 0; i < f.lines.length; i++) {
    if (skip[i]) {
      continue;
    }
    const line = f.lines[i] ?? "";
    symbols += countSymbolsInLine(line, bySymbol);
    abbreviations += countAbbreviations(line, byAbbreviation, isTaskFile);
    bareRefs += findBareRefs(line, knownBasenames).length;
  }

  return {
    rel: f.rel,
    symbols,
    abbreviations,
    bareRefs,
    bySymbol,
    byAbbreviation,
  };
}

// ─── in kết quả ──────────────────────────────────────────────────────────────

function mergeInto(target: Map<string, number>, source: Map<string, number>) {
  for (const [k, v] of source) {
    target.set(k, (target.get(k) ?? 0) + v);
  }
}

function printTable(
  title: string,
  counts: Map<string, number>,
  totalLabel: string
) {
  console.log(`\n${title}`);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [key, count] of rows) {
    console.log(`  ${key.padEnd(12)} ${count}`);
  }
  const total = rows.reduce((sum, [, c]) => sum + c, 0);
  console.log(`  ${totalLabel}: ${total}`);
}

function main() {
  const prefixArg = process.argv[2];
  const allFiles = collectDocsFiles(DOCS_DIR);
  const basenameMap = buildBasenameMap(allFiles);
  const knownBasenames = new Set(basenameMap.keys());

  const filtered = prefixArg
    ? allFiles.filter((f) => f.rel.startsWith(prefixArg))
    : allFiles;

  const perFile: FileCounts[] = filtered.map((f) =>
    countFile(f, knownBasenames)
  );

  const debtFiles = perFile.filter((f) => !EXCLUDED_FROM_DEBT.has(f.rel));
  const excludedFiles = perFile.filter((f) => EXCLUDED_FROM_DEBT.has(f.rel));

  const bySymbolTotal = new Map<string, number>();
  const byAbbrTotal = new Map<string, number>();
  for (const f of debtFiles) {
    mergeInto(bySymbolTotal, f.bySymbol);
    mergeInto(byAbbrTotal, f.byAbbreviation);
  }

  printTable("Theo ký hiệu:", bySymbolTotal, "Tổng ký hiệu");
  printTable("Theo chữ viết tắt:", byAbbrTotal, "Tổng viết tắt");

  console.log("\nTheo file (chỉ file có ít nhất 1 vấn đề):");
  const sortedFiles = [...debtFiles]
    .filter((f) => f.symbols + f.abbreviations + f.bareRefs > 0)
    .sort(
      (a, b) =>
        b.symbols +
        b.abbreviations +
        b.bareRefs -
        (a.symbols + a.abbreviations + a.bareRefs)
    );
  for (const f of sortedFiles) {
    console.log(
      `  ${f.rel.padEnd(55)} kh=${f.symbols} vt=${f.abbreviations} tc=${f.bareRefs}`
    );
  }

  const totalSymbols = debtFiles.reduce((s, f) => s + f.symbols, 0);
  const totalAbbr = debtFiles.reduce((s, f) => s + f.abbreviations, 0);
  const totalBareRefs = debtFiles.reduce((s, f) => s + f.bareRefs, 0);

  console.log("\n─────────────────────────────────────────────");
  console.log(
    `Tổng: ${debtFiles.length} file · ${totalSymbols} ký hiệu · ${totalAbbr} viết tắt · ${totalBareRefs} tham chiếu trần`
  );
  console.log(`Đã quét: ${perFile.length} file dưới docs/${prefixArg ?? ""}`);

  if (excludedFiles.length > 0 && !prefixArg) {
    console.log(
      `Loại khỏi nợ (hồ sơ Task #4/#5, xem chú giải đầu file): ${excludedFiles
        .map(
          (f) =>
            `${f.rel} (kh=${f.symbols} vt=${f.abbreviations} tc=${f.bareRefs})`
        )
        .join(" · ")}`
    );
  }
}

main();
