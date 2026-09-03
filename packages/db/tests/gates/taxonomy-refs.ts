/**
 * Cổng: `check:taxonomy-refs`.
 *
 * Mọi mã kỹ năng xuất hiện trong `docs/**` và trong corpus `seed-content/**`
 * phải tồn tại trong `docs/taxonomy/c*.md`.
 *
 * Vì sao cần: không cổng nào đối chiếu mã kỹ năng với taxonomy thật. Trước cổng
 * này `moet-alignment.md` trỏ vào `C3.PAT.01` (không tồn tại — strand quy luật
 * là `C1.PAT`), `lesson-map.md` mang 9 mã chết trong 45, và corpus từng có 20
 * "mã ma" mà tác giả tự đặt. Không cổng nào bắt được cả ba.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { parseTaxonomyDocs } from "#src/seed-master/taxonomy/index";

export interface TaxonomyRefViolation {
  readonly file: string;
  readonly line: number;
  readonly code: string;
  readonly snippet: string;
}

/** Bắt cả mã sai khuôn (`C2.3D.01`) lẫn mã đúng khuôn nhưng không tồn tại. */
const SKILL_REF_REGEX = /\bC[1-6]\.[A-Z0-9]{1,5}\.\d{2}\b/g;

const SCAN_DIRS = ["docs", "packages/db/src/seed-content"] as const;
const SCAN_EXTENSIONS = new Set([".md", ".ts", ".json"]);
const SKIP_DIR_REGEX = /^(node_modules|\.nuxt|\.output|dist|generated)$/;

/**
 * File cố tình chứa mã đã chết: bảng ánh xạ sửa chúng, và tài liệu kể lại việc
 * sửa. Quét chúng là bắt đúng thứ chúng sinh ra để dọn.
 */
const ALLOW_FILE_REGEX =
  /(remap-phantom-skills|fix-phantom-skill-targets)\.ts$|docs\/tasks\//;

/**
 * Lối thoát theo dòng cho **bản ghi lịch sử**: spec kể lại một phép đo cũ dùng
 * mã taxonomy v1 đã bỏ. Sửa những mã đó thành mã mới là làm sai bản ghi. Đánh
 * dấu thì giữ được sự thật mà cổng vẫn chặn mã chết ở chỗ nó gây hại.
 */
const HISTORICAL_MARKER = "taxonomy-refs:historical";

function walk(dir: string, out: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIR_REGEX.test(entry)) {
        walk(full, out);
      }
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

/** Quét một nội dung bất kỳ — dùng cho ca âm, không cần chạm đĩa. */
export function scanTaxonomyRefs(
  file: string,
  content: string,
  known: ReadonlySet<string>
): TaxonomyRefViolation[] {
  const violations: TaxonomyRefViolation[] = [];
  const lines = content.split("\n");

  // Dấu lịch sử có phạm vi **một khối**: từ dòng đánh dấu tới dòng trống kế
  // tiếp. Bảng và danh sách nhiều dòng nên đánh dấu một lần, không phải mỗi
  // dòng một lần.
  let inHistoricalBlock = false;

  for (const [index, line] of lines.entries()) {
    if (line.includes(HISTORICAL_MARKER)) {
      inHistoricalBlock = true;
      continue;
    }
    if (inHistoricalBlock) {
      if (line.trim() === "") {
        inHistoricalBlock = false;
      }
      continue;
    }
    for (const match of line.matchAll(SKILL_REF_REGEX)) {
      const code = match[0];
      if (known.has(code)) {
        continue;
      }
      violations.push({
        file,
        line: index + 1,
        code,
        snippet: line.trim().slice(0, 120),
      });
    }
  }

  return violations;
}

export function knownSkillCodes(): ReadonlySet<string> {
  return new Set(
    parseTaxonomyDocs(join(REPO_ROOT, "docs/taxonomy")).map((s) => s.code)
  );
}

export function runTaxonomyRefsGate(): TaxonomyRefViolation[] {
  const known = knownSkillCodes();
  const violations: TaxonomyRefViolation[] = [];

  for (const dir of SCAN_DIRS) {
    const files = walk(join(REPO_ROOT, dir), []);
    for (const file of files) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOW_FILE_REGEX.test(rel)) {
        continue;
      }
      violations.push(
        ...scanTaxonomyRefs(rel, readFileSync(file, "utf8"), known)
      );
    }
  }

  return violations;
}
