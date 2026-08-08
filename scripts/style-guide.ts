/**
 * Bảng thay thế + logic quét dùng chung cho Task #4 (viết lại corpus theo
 * ngôn ngữ tự nhiên) — xem docs/tasks/04-readability-spec.md mục 4.1, 4.2, 5.1.
 *
 * Dùng chung bởi:
 *   - scripts/inventory-symbols.ts  (đếm nợ, không chặn)
 *   - scripts/lint-specs-lib.ts     (checkC14, checkC15 — chặn thật)
 *
 * Tách riêng file này để hai nơi trên không định nghĩa hai bảng ký hiệu
 * lệch nhau theo thời gian (DRY) — xem coding-style.md.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

// ─── mục 4.1 — bảng thay thế ký hiệu ────────────────────────────────────────
// 14 dòng bảng, 16 mẫu khớp — ⚠️ và ⏸ mỗi ký hiệu có hai dạng Unicode (có/không
// kèm variation selector U+FE0F), gộp cùng một "name" khi báo cáo.

export const SYMBOLS: { char: string; name: string }[] = [
  { char: "❌", name: "❌" },
  { char: "✅", name: "✅" },
  { char: "⚠️", name: "⚠️" },
  { char: "⚠", name: "⚠️" }, // bare U+26A0, không kèm variation selector
  { char: "⛔", name: "⛔" },
  { char: "⟂", name: "⟂" },
  { char: "👤", name: "👤" },
  { char: "🟡", name: "🟡" },
  { char: "🔴", name: "🔴" },
  { char: "❗", name: "❗" },
  { char: "⏸️", name: "⏸" },
  { char: "⏸", name: "⏸" }, // bare U+23F8
  { char: "⟷", name: "⟷" },
  { char: "⊂", name: "⊂" },
  { char: "⇒", name: "⇒" },
  { char: "✱", name: "✱" },
];

export function countSymbolsInLine(
  line: string,
  bySymbol?: Map<string, number>
): number {
  let total = 0;
  for (const { char, name } of SYMBOLS) {
    let idx = line.indexOf(char);
    while (idx !== -1) {
      total++;
      if (bySymbol) {
        bySymbol.set(name, (bySymbol.get(name) ?? 0) + 1);
      }
      idx = line.indexOf(char, idx + char.length);
    }
  }
  return total;
}

// ─── mục 4.2 — bảng thay thế chữ viết tắt tự phát ───────────────────────────
// LO, ZPD, KPI KHÔNG nằm ở đây — thuật ngữ chuyên môn giữ nguyên, mục 4.3.

export const ABBREVIATIONS = [
  "OQ",
  "DMO",
  "SIB",
  "SCT",
  "SPT",
  "TAX",
  "GTC",
  "CLC",
  "CP-C",
  "CP-D",
];

/** `Tn` — "T0", "T4b", "T11". Chỉ có nghĩa "bước" trong hồ sơ task. */
export const T_STEP_PATTERN =
  /(?<![A-Za-z0-9-])T\d{1,2}[a-z]?(?![A-Za-z0-9-])/g;
/** `Mn` — "M1" tới "M11", ký hiệu mâu thuẫn, chỉ có nghĩa trong hồ sơ task. */
export const M_CONFLICT_PATTERN = /(?<![A-Za-z0-9-])M\d{1,2}(?![A-Za-z0-9-])/g;

// ─── bỏ khối mã + frontmatter — cùng quy ước với checkC9/checkC10 ───────────

export function frontmatterEndLine(lines: string[]): number {
  if (lines[0]?.trim() !== "---") {
    return -1;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      return i;
    }
  }
  return -1;
}

/** true tại index i ⇒ dòng đó nằm trong khối mã hoặc frontmatter, bỏ quét. */
export function computeSkipLines(lines: string[]): boolean[] {
  const skip = new Array(lines.length).fill(false);
  const fmEnd = frontmatterEndLine(lines);
  if (fmEnd >= 0) {
    for (let i = 0; i <= fmEnd; i++) {
      skip[i] = true;
    }
  }
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (skip[i]) {
      continue;
    }
    if (lines[i]?.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      skip[i] = true;
      continue;
    }
    if (inCodeBlock) {
      skip[i] = true;
    }
  }
  return skip;
}

// ─── mục 5.1 — danh sách hoãn theo thư mục cho C14/C15 ──────────────────────
//
// Quyết định thiết kế 1 của plan.md: hai kiểm tra nhận MỘT danh sách hoãn
// chung, mỗi đợt xong một khu vực thì xoá khu vực đó, trong cùng commit.
// Đường dẫn tính từ docs/. Rỗng ở bước 20 — không còn loại trừ nào.
//
// So với todo.md bước 2 ("chín khu vực cộng 6 file quy ước cộng
// docs/taxonomy/ cộng docs/tasks/"): thêm "SPEC.md" vào danh sách ban đầu.
// SPEC.md đo được có 93 ký hiệu ngay lúc viết bước này và không được bước
// nào khác sửa trước bước 14 — bỏ sót nó khỏi danh sách hoãn sẽ làm C14/C15
// đỏ giả ngay từ bước 2, trước khi có bước nào chạm tới nó. Cùng loại lỗi đã
// từng xảy ra với `docs/taxonomy/` ở bản nháp đầu — ghi lại ở đây để không
// lặp lại lần hai.
export const STYLE_DEFERRED: string[] = [
  "specs/06-admin/",
  "specs/07-addon/",
  "specs/CONVENTIONS.md",
  "specs/TEMPLATE.md",
  "specs/READING-GUIDE.md",
  "specs/index.md",
  "specs/roadmap.md",
  "specs/AUDIT-v1.md",
  "taxonomy/",
  "tasks/",
  "SPEC.md",
];

export function isDeferred(
  docsRel: string,
  deferred: readonly string[]
): boolean {
  return deferred.some((prefix) =>
    prefix.endsWith("/") ? docsRel.startsWith(prefix) : docsRel === prefix
  );
}

// ─── thu thập toàn bộ docs/*.md — dùng chung cho C14/C15/inventory ──────────

export interface DocsFile {
  /** relative to docs/ */
  rel: string;
  /** absolute path */
  abs: string;
  lines: string[];
}

function walkMarkdownFiles(dir: string, out: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkMarkdownFiles(full, out);
    } else if (extname(entry) === ".md") {
      out.push(full);
    }
  }
  return out;
}

export function collectDocsFiles(docsDir: string): DocsFile[] {
  const paths = walkMarkdownFiles(docsDir, []);
  return paths
    .map((p) => ({
      rel: relative(docsDir, p),
      abs: p,
      lines: readFileSync(p, "utf-8").split("\n"),
    }))
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

// ─── mục 5.1 — tham chiếu trần: tên file trong backtick, không phải liên kết ──

/** Bọc mọi span `[`tên`](đường-dẫn)` thành khoảng trắng cùng độ dài. */
export function maskMarkdownLinks(line: string): string {
  return line.replace(/\[`[^`]+`\]\([^)]*\)/g, (m) => " ".repeat(m.length));
}

export interface BareRefMatch {
  /** chuỗi trong backtick, ví dụ "access-ladder" hoặc "access-ladder.md" */
  raw: string;
  /** tên file không có .md, dùng để tra basenameToRel */
  candidate: string;
}

/**
 * Basename trùng một thuật ngữ chuyên môn thường dùng (mục 4.3/11.3) — chỉ
 * tính là tham chiếu file khi viết đủ ".md", vì `` `index` `` áp gần như
 * chắc chắn là "database index" (thuật ngữ, giữ nguyên), không phải nhắc
 * tới `specs/index.md`. `` `index.md` `` (có .md) thì không mơ hồ, vẫn bắt.
 */
const AMBIGUOUS_WITHOUT_MD_SUFFIX = new Set(["index", "plan"]);

/** Tìm mọi backtick-span khớp một basename đã biết, KHÔNG nằm trong liên kết. */
export function findBareRefs(
  line: string,
  knownBasenames: ReadonlySet<string>
): BareRefMatch[] {
  const masked = maskMarkdownLinks(line);
  const found: BareRefMatch[] = [];
  const backtickPattern = /`([^`]+)`/g;
  for (const match of masked.matchAll(backtickPattern)) {
    const raw = match[1] ?? "";
    const hasMdSuffix = raw.endsWith(".md");
    const candidate = hasMdSuffix ? raw.slice(0, -3) : raw;
    if (!hasMdSuffix && AMBIGUOUS_WITHOUT_MD_SUFFIX.has(candidate)) {
      continue;
    }
    if (knownBasenames.has(candidate)) {
      found.push({ raw, candidate });
    }
  }
  return found;
}

/**
 * basename (không .md) → danh sách docsRel khớp. Phần lớn basename chỉ có
 * một file khớp; "index" là ca ngoại lệ (specs/index.md và taxonomy/index.md
 * đều có basename "index") — C15 gợi ý file cùng nhánh với file đang quét
 * trước, không thì lấy file đầu tiên theo thứ tự bảng chữ.
 */
export function buildBasenameMap(files: DocsFile[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const f of files) {
    const name = basename(f.rel, ".md");
    const list = map.get(name) ?? [];
    list.push(f.rel);
    map.set(name, list);
  }
  return map;
}

/** Chọn target hợp lý nhất khi một basename khớp nhiều file (ca "index"). */
export function pickBestTarget(
  candidates: readonly string[],
  fromDocsRel: string
): string {
  const first = candidates[0] ?? "";
  if (candidates.length === 1) {
    return first;
  }
  const fromTop = fromDocsRel.split("/")[0];
  const sameTop = candidates.find((c) => c.split("/")[0] === fromTop);
  return sameTop ?? first;
}
