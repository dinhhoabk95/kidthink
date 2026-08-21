import fs from "node:fs";
import path from "node:path";

const SKIP_DIR =
  /(^|\/)(node_modules|\.nuxt|\.output|dist|coverage|\.git)(\/|$)/;
const TEST_PATH = /(^|\/)tests?(\/|$)|\.test\.ts$|\.spec\.ts$/;
const FIXTURE_PATH = /(^|\/)tests?\/(?:[^/]+\/)*fixtures(\/|$)/;
const GATE_PACKAGE_PATH = /(^|\/)packages\/gates(\/|$)/;
const SOURCE_FILE = /\.(ts|vue)$/;

/** Đi hết cây, bỏ thư mục sinh ra và thư mục phụ thuộc. */
export function walkSource(
  dir: string,
  out: string[] = [],
  scanRoot: string = dir
): string[] {
  if (!fs.existsSync(dir) || SKIP_DIR.test(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (SKIP_DIR.test(full) || isFixturePath(full, scanRoot)) {
      continue;
    }
    if (entry.isDirectory()) {
      walkSource(full, out, scanRoot);
    } else if (SOURCE_FILE.test(full)) {
      out.push(full);
    }
  }
  return out;
}

export function isTestPath(file: string): boolean {
  return TEST_PATH.test(file);
}

/**
 * Bỏ comment và nội dung chuỗi để phép đếm không bắt chữ trong văn xuôi.
 *
 * ❌ NEVER đếm trực tiếp trên nguồn thô: "as" xuất hiện trong tiếng Anh và
 * tiếng Việt ("phase", "as long as", tên biến), và `any` xuất hiện trong
 * "company", "many". Bản đo đầu tiên của cổng này lệch 149 → 0 vì lý do đó.
 */
export function stripCommentsAndStrings(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:\\])\/\/[^\n]*/g, "$1 ")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
}

/**
 * Fixture của cổng là **mẫu vi phạm cố ý** — nó ❌ NEVER được tính là mã sản
 * phẩm. Trước quy ước này, fixture nằm ngoài `apps/`+`packages/` nên không ai
 * phải nghĩ tới; khi cổng dọn về `packages/gates`, fixture `bad/` của
 * `lint:env-names` lọt vào chính cây mà cổng quét và làm cổng đỏ giả.
 *
 * Chỉ khớp `tests/fixtures/` — ❌ NEVER khớp mọi thư mục tên `fixtures`, vì như
 * thế một thư mục `fixtures` trong mã sản phẩm sẽ tàng hình trước mọi cổng.
 *
 * `packages/gates` cũng không phải mã sản phẩm: nó **định nghĩa** danh sách mẫu
 * bị cấm (bảng `DEPRECATED_ENV_NAMES`, regex giá, từ vựng cấm), nên quét chính
 * nó là tự bắt định nghĩa của mình. Loại trừ tính theo `scanRoot` để ca âm —
 * thứ cố tình trỏ cổng vào fixture — vẫn đỏ được.
 */
export function isFixturePath(file: string, scanRoot?: string): boolean {
  const rel = scanRoot ? path.relative(scanRoot, file) : file;
  return FIXTURE_PATH.test(rel) || GATE_PACKAGE_PATH.test(rel);
}
