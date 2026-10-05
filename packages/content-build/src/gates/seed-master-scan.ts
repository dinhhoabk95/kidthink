/**
 * Cổng quét `seed-master/`: cấm chọn nội dung cho tiết học bằng phép chia lấy
 * dư, `LIMIT` hay thứ tự `id` (BR-LRM-02).
 *
 * Quét văn bản chứ không chạy code: phép gán cũ luôn cho kết quả trông hợp lý,
 * nên chỉ bắt được bằng cách cấm hình dạng của nó.
 */

export interface SeedMasterSource {
  readonly path: string;
  readonly source: string;
}

export type SeedMasterViolationKind = "modulo" | "limit-or-order";

export interface SeedMasterViolation {
  readonly path: string;
  readonly line: number;
  readonly functionName: string;
  readonly kind: SeedMasterViolationKind;
}

const MODULE_SCOPE = "<module>";
const FUNCTION_NAME_REGEX = /function\s+([A-Za-z_$][\w$]*)/g;
const CONTENT_TABLE_REGEX = /\.from\(\s*(?:lessons|gameLevels)\s*\)/;
const LIMIT_OR_ORDER_REGEX = /\.(?:limit|orderBy)\(/;

const NON_NEWLINE_REGEX = /[^\n]/g;
const QUOTES = new Set(["'", '"', "`"]);

function blank(text: string): string {
  return text.replace(NON_NEWLINE_REGEX, " ");
}

function endOfLineComment(source: string, from: number): number {
  const end = source.indexOf("\n", from);
  return end === -1 ? source.length : end;
}

function endOfBlockComment(source: string, from: number): number {
  const end = source.indexOf("*/", from + 2);
  return end === -1 ? source.length : end + 2;
}

function endOfString(source: string, from: number, quote: string): number {
  let j = from + 1;
  while (j < source.length && source.charAt(j) !== quote) {
    j += source.charAt(j) === "\\" ? 2 : 1;
  }
  return j + 1;
}

function nonCodeEnd(source: string, i: number): number | null {
  const two = source.slice(i, i + 2);
  if (two === "//") {
    return endOfLineComment(source, i);
  }
  if (two === "/*") {
    return endOfBlockComment(source, i);
  }
  const ch = source.charAt(i);
  return QUOTES.has(ch) ? endOfString(source, i, ch) : null;
}

function stripNonCode(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const end = nonCodeEnd(source, i);
    if (end === null) {
      out += source.charAt(i);
      i++;
    } else {
      out += blank(source.slice(i, end));
      i = end;
    }
  }
  return out;
}

function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (text.charAt(i) === "\n") {
      line++;
    }
  }
  return line;
}

function enclosingFunction(code: string, index: number): string {
  let name = MODULE_SCOPE;
  for (const match of code.matchAll(FUNCTION_NAME_REGEX)) {
    if (match.index !== undefined && match.index < index) {
      name = match[1] ?? MODULE_SCOPE;
    }
  }
  return name;
}

function findModulo(
  file: SeedMasterSource,
  code: string
): SeedMasterViolation[] {
  const found: SeedMasterViolation[] = [];
  for (let i = 0; i < code.length; i++) {
    if (code.charAt(i) === "%") {
      found.push({
        path: file.path,
        line: lineOf(code, i),
        functionName: enclosingFunction(code, i),
        kind: "modulo",
      });
    }
  }
  return found;
}

function findContentQueries(
  file: SeedMasterSource,
  code: string
): SeedMasterViolation[] {
  const found: SeedMasterViolation[] = [];
  let offset = 0;
  for (const statement of code.split(";")) {
    if (
      CONTENT_TABLE_REGEX.test(statement) &&
      LIMIT_OR_ORDER_REGEX.test(statement)
    ) {
      const at = offset + statement.search(CONTENT_TABLE_REGEX);
      found.push({
        path: file.path,
        line: lineOf(code, at),
        functionName: enclosingFunction(code, at),
        kind: "limit-or-order",
      });
    }
    offset += statement.length + 1;
  }
  return found;
}

export function scanSeedMaster(
  files: readonly SeedMasterSource[]
): SeedMasterViolation[] {
  return files.flatMap((file) => {
    const code = stripNonCode(file.source);
    return [...findModulo(file, code), ...findContentQueries(file, code)];
  });
}

export function formatSeedMasterViolation(
  violation: SeedMasterViolation
): string {
  const what =
    violation.kind === "modulo"
      ? "phép chia lấy dư (%)"
      : "LIMIT/orderBy trên lessons/game_levels";
  return `${violation.path}:${violation.line} hàm ${violation.functionName}: ${what} chọn nội dung cho tiết (BR-LRM-02)`;
}
