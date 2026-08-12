/**
 * lint:tokens — cấm màu và font viết cứng ngoài designTokens.ts.
 *
 * SPEC.md §7 khai lệnh này là một trong ba bước của `pnpm check`.
 * Lý do rule: game-engine-runtime.md `BR-ENG-*` — entity gọi màu bằng **tên
 * token**; hex literal fallback im lặng, sai màu mà không ai biết.
 *
 * Bản v1 (packages/game-engine/scripts/lint-tokens.ts) chỉ quét thư mục engine.
 * Bản này quét toàn workspace vì rule áp cho cả `.vue` — xem plan.md D-D.
 */

import { type Dirent, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

interface Finding {
  column: number;
  file: string;
  kind: "hex" | "font";
  line: number;
  value: string;
}

const ROOT = resolve(import.meta.dirname, "..");
const SCAN_ROOTS = ["apps", "packages"];
// `.css`/`.scss` bắt buộc có: Nuxt để global style ở apps/*/assets/css/*.css —
// đúng chỗ hex thương hiệu rơi vào đầu tiên. Bản chỉ quét .ts/.vue để lọt.
const SCAN_EXTENSIONS = [".ts", ".vue", ".css", ".scss", ".postcss"];
const SKIP_DIRS = new Set([
  ".git",
  ".nuxt",
  ".output",
  "coverage",
  "dist",
  "node_modules",
]);

/** Chỉ các file này được viết màu thô — chúng LÀ định nghĩa hoặc test token. */
const ALLOWED_BASENAMES = new Set([
  "designTokens.ts",
  "designTokens.test.ts",
  "tailwind.css",
  "tokens.test.ts",
]);

/**
 * Hex màu CSS hợp lệ chỉ có 3, 4, 6 hoặc 8 chữ số — ❌ không phải `{3,8}`.
 *
 * Hai chốt chặn false positive, đo trên ca âm thật:
 *   `(?<![\w/])`  — `#` đứng sau chữ/số/`/` là fragment URL hoặc path
 *                   (`docs#abcdef`, `issues/12#c0ffee`), ❌ không phải màu.
 *   `(?![\w])`    — chặn nuốt một phần chuỗi dài hơn (`#a1b2c3d` 7 ký tự:
 *                   khớp 6 rồi còn `d` → loại, không báo nhầm commit SHA).
 *
 * Còn sót: `#dad` (3 ký tự hex, id selector). Không tách được khỏi màu thật
 * bằng regex — chấp nhận, tần suất thấp, sửa bằng đổi tên id.
 */
const HEX_PATTERN =
  /(?<![\w/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w])/g;
const INLINE_FONT_PATTERN = /\b(?:this\.)?ctx\.font\s*=\s*["'`]/g;

const MAX_REPORTED = 80;

function collectFiles(dir: string): string[] {
  let entries: Dirent[];
  try {
    // withFileTypes: tránh statSync riêng cho mỗi entry — statSync ném khi gặp
    // symlink gãy và làm cả gate chết bằng stack trace thay vì báo vi phạm.
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // thư mục chưa tồn tại ở bootstrap — không phải lỗi
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (
      entry.isFile() &&
      SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineAndColumn(source: string, index: number): [number, number] {
  const lines = source.slice(0, index).split("\n");
  return [lines.length, (lines.at(-1)?.length ?? 0) + 1];
}

function findMatches(
  source: string,
  file: string,
  pattern: RegExp,
  kind: Finding["kind"]
): Finding[] {
  const findings: Finding[] = [];
  for (const match of source.matchAll(pattern)) {
    const [line, column] = lineAndColumn(source, match.index ?? 0);
    findings.push({ column, file, kind, line, value: match[0] });
  }
  return findings;
}

const findings = SCAN_ROOTS.flatMap((scanRoot) =>
  collectFiles(join(ROOT, scanRoot))
).flatMap((filePath) => {
  const file = relative(ROOT, filePath);
  if (ALLOWED_BASENAMES.has(file.split("/").at(-1) ?? "")) {
    return [];
  }
  const source = readFileSync(filePath, "utf8");
  return [
    ...findMatches(source, file, HEX_PATTERN, "hex"),
    ...findMatches(source, file, INLINE_FONT_PATTERN, "font"),
  ];
});

if (findings.length === 0) {
  process.exit(0);
}

process.stdout.write(
  `[lint:tokens] ${findings.length} vi phạm — màu/font phải lấy từ designTokens.ts\n`
);
for (const finding of findings.slice(0, MAX_REPORTED)) {
  process.stdout.write(
    `${finding.file}:${finding.line}:${finding.column} ${finding.kind} ${finding.value}\n`
  );
}
if (findings.length > MAX_REPORTED) {
  process.stdout.write(
    `[lint:tokens] ...và ${findings.length - MAX_REPORTED} vi phạm nữa\n`
  );
}
process.exit(1);
