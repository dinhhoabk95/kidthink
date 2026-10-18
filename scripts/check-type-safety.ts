/**
 * Cổng kiểm tra An toàn kiểu (Type Safety Gate) — Task #310 S7 (BR-TYP-01..08).
 *
 * Quét toàn bộ `packages/` và `apps/` bằng TypeScript lexical scanner để kiểm soát:
 * - BR-TYP-01: Cấm `any` tường minh và `@ts-expect-error` / `@ts-expect-error` trong production code
 * - BR-TYP-02 / BR-TYP-03: Cấm `as unknown as` và khai báo `unknown` mới (ratchet chỉ giảm)
 * - BR-TYP-05: `as const` hợp lệ, không bị tính là nợ ép kiểu
 * - BR-TYP-08: Cấm `any` tường minh trong file test (ratchet chỉ giảm)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import ts from "typescript";

export type TypeSafetyRuleId =
  | "BR-TYP-01"
  | "BR-TYP-02"
  | "BR-TYP-03"
  | "BR-TYP-05"
  | "BR-TYP-08";

export type TypeSafetyViolationKind =
  | "ts-directive"
  | "explicit-any"
  | "test-any"
  | "as-unknown-as"
  | "unknown-declaration";

export interface TypeSafetyIssue {
  readonly file: string;
  readonly line: number;
  readonly rule: TypeSafetyRuleId;
  readonly kind: TypeSafetyViolationKind;
  readonly snippet: string;
}

export interface FileTypeSafetyCounts {
  readonly tsDirectives: number;
  readonly explicitAny: number;
  readonly asUnknownAs: number;
  readonly unknownDeclarations: number;
}

export interface TypeSafetyBaseline {
  readonly totals: FileTypeSafetyCounts;
  readonly files: Record<string, FileTypeSafetyCounts>;
}

export interface SourceScanResult {
  readonly counts: FileTypeSafetyCounts;
  readonly issues: TypeSafetyIssue[];
  readonly asConstCount: number;
}

export interface TypeSafetyVerdict {
  readonly ok: boolean;
  readonly regressions: string[];
}

interface ScannedToken {
  readonly kind: ts.SyntaxKind;
  readonly pos: number;
}

const TS_DIRECTIVE_COMMENT_RE =
  /^\s*(?:\/\/|\/\*+)\s*@ts-(?:ignore|expect-error)\b/;

const VUE_SCRIPT_BLOCK_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

const TEST_FILE_SUFFIX_RE = /\.(?:test|spec)\.ts$/;

function isTestFilePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    TEST_FILE_SUFFIX_RE.test(normalized) ||
    normalized.includes("/tests/") ||
    normalized.includes("/__tests__/")
  );
}

function buildLineStarts(source: string): number[] {
  const starts: number[] = [0];
  for (let i = 0; i < source.length; i++) {
    if (source.charCodeAt(i) === 10) {
      starts.push(i + 1);
    }
  }
  return starts;
}

function lineNumberFromStarts(lineStarts: number[], pos: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = lineStarts[mid] ?? 0;
    if (midVal <= pos) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return Math.max(1, low);
}

function getLineText(
  lines: string[],
  lineStarts: number[],
  pos: number
): { line: number; snippet: string } {
  const line = lineNumberFromStarts(lineStarts, pos);
  const rawLine = lines[line - 1] ?? "";
  return { line, snippet: rawLine.trim() };
}

/**
 * Với file `.vue`, giữ nguyên vị trí dòng bằng cách thay phần ngoài `<script>` bằng newline tương ứng.
 */
function maskNonScriptInVue(vueSource: string): string {
  let result = "";
  let cursor = 0;
  for (const match of vueSource.matchAll(VUE_SCRIPT_BLOCK_RE)) {
    const fullMatch = match[0];
    const body = match[1] ?? "";
    const matchStart = match.index ?? 0;
    const bodyOffsetInMatch = fullMatch.indexOf(body);
    if (bodyOffsetInMatch >= 0) {
      const start = matchStart + bodyOffsetInMatch;
      const skipped = vueSource.slice(cursor, start);
      result += skipped.replace(/[^\n]/g, " ");
      result += body;
      cursor = start + body.length;
    }
  }
  if (cursor < vueSource.length) {
    result += vueSource.slice(cursor).replace(/[^\n]/g, " ");
  }
  return result;
}

const ZERO_COUNTS: FileTypeSafetyCounts = {
  tsDirectives: 0,
  explicitAny: 0,
  asUnknownAs: 0,
  unknownDeclarations: 0,
};

function hasRelevantKeywords(rawSource: string): boolean {
  return (
    rawSource.includes("any") ||
    rawSource.includes("unknown") ||
    rawSource.includes("@ts-") ||
    rawSource.includes("as const")
  );
}

function collectScannerTokens(
  source: string,
  filePath: string,
  lines: string[],
  lineStarts: number[],
  issues: TypeSafetyIssue[]
): { tokens: ScannedToken[]; tsDirectives: number } {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    source
  );
  const tokens: ScannedToken[] = [];
  let tsDirectives = 0;

  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const isComment =
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia;
    if (isComment) {
      if (TS_DIRECTIVE_COMMENT_RE.test(scanner.getTokenText())) {
        tsDirectives++;
        const { line, snippet } = getLineText(
          lines,
          lineStarts,
          scanner.getTokenStart()
        );
        issues.push({
          file: filePath,
          line,
          rule: "BR-TYP-01",
          kind: "ts-directive",
          snippet,
        });
      }
    } else if (
      token !== ts.SyntaxKind.WhitespaceTrivia &&
      token !== ts.SyntaxKind.NewLineTrivia
    ) {
      tokens.push({ kind: token, pos: scanner.getTokenStart() });
    }
    token = scanner.scan();
  }

  return { tokens, tsDirectives };
}

function classifyUnknownToken(
  prev: ScannedToken | undefined,
  next: ScannedToken | undefined,
  pos: number,
  filePath: string,
  lines: string[],
  lineStarts: number[],
  issues: TypeSafetyIssue[]
): "as-unknown-as" | "unknown" {
  const { line, snippet } = getLineText(lines, lineStarts, pos);
  const isDoubleCast =
    prev?.kind === ts.SyntaxKind.AsKeyword &&
    next?.kind === ts.SyntaxKind.AsKeyword;
  issues.push({
    file: filePath,
    line,
    rule: isDoubleCast ? "BR-TYP-02" : "BR-TYP-03",
    kind: isDoubleCast ? "as-unknown-as" : "unknown-declaration",
    snippet,
  });
  return isDoubleCast ? "as-unknown-as" : "unknown";
}

function classifySingleToken(
  tokens: ScannedToken[],
  index: number,
  filePath: string,
  isTest: boolean,
  lines: string[],
  lineStarts: number[],
  issues: TypeSafetyIssue[]
): "as-const" | "any" | "as-unknown-as" | "unknown" | "none" {
  const current = tokens[index];
  if (!current) {
    return "none";
  }
  const prev = tokens[index - 1];
  const next = tokens[index + 1];

  if (
    current.kind === ts.SyntaxKind.AsKeyword &&
    next?.kind === ts.SyntaxKind.ConstKeyword
  ) {
    return "as-const";
  }
  if (prev?.kind === ts.SyntaxKind.DotToken) {
    return "none";
  }
  if (current.kind === ts.SyntaxKind.AnyKeyword) {
    const { line, snippet } = getLineText(lines, lineStarts, current.pos);
    issues.push({
      file: filePath,
      line,
      rule: isTest ? "BR-TYP-08" : "BR-TYP-01",
      kind: isTest ? "test-any" : "explicit-any",
      snippet,
    });
    return "any";
  }
  if (current.kind === ts.SyntaxKind.UnknownKeyword) {
    return classifyUnknownToken(
      prev,
      next,
      current.pos,
      filePath,
      lines,
      lineStarts,
      issues
    );
  }
  return "none";
}

/**
 * Quét một file nguồn TypeScript/Vue bằng lexical scanner của TypeScript (`BR-TYP-01..08`).
 */
export function scanTypeSafetyInSource(
  rawSource: string,
  filePath = "inline.ts"
): SourceScanResult {
  if (!hasRelevantKeywords(rawSource)) {
    return {
      counts: ZERO_COUNTS,
      issues: [],
      asConstCount: 0,
    };
  }

  const source = filePath.endsWith(".vue")
    ? maskNonScriptInVue(rawSource)
    : rawSource;
  const isTest = isTestFilePath(filePath);
  const lines = rawSource.split("\n");
  const lineStarts = buildLineStarts(rawSource);
  const issues: TypeSafetyIssue[] = [];

  const { tokens, tsDirectives } = collectScannerTokens(
    source,
    filePath,
    lines,
    lineStarts,
    issues
  );

  let explicitAny = 0;
  let asUnknownAs = 0;
  let unknownDeclarations = 0;
  let asConstCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tag = classifySingleToken(
      tokens,
      i,
      filePath,
      isTest,
      lines,
      lineStarts,
      issues
    );
    if (tag === "as-const") {
      asConstCount++;
    } else if (tag === "any") {
      explicitAny++;
    } else if (tag === "as-unknown-as") {
      asUnknownAs++;
    } else if (tag === "unknown") {
      unknownDeclarations++;
    }
  }

  return {
    counts: {
      tsDirectives,
      explicitAny,
      asUnknownAs,
      unknownDeclarations,
    },
    issues,
    asConstCount,
  };
}

function collectSourceFiles(dir: string, out: string[]): void {
  if (!fs.existsSync(dir)) {
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".nuxt" ||
      entry.name === ".output" ||
      entry.name === "dist" ||
      entry.name === ".git" ||
      entry.name === "coverage"
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, out);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".vue")) &&
      !entry.name.endsWith(".d.ts")
    ) {
      out.push(fullPath);
    }
  }
}

function hasNonZeroCounts(counts: FileTypeSafetyCounts): boolean {
  return (
    counts.tsDirectives > 0 ||
    counts.explicitAny > 0 ||
    counts.asUnknownAs > 0 ||
    counts.unknownDeclarations > 0
  );
}

/**
 * Quét toàn bộ `packages/` và `apps/` trong monorepo.
 */
export function scanRepoTypeSafety(rootDir: string = repoPath()): {
  totals: FileTypeSafetyCounts;
  files: Record<string, FileTypeSafetyCounts>;
  issues: TypeSafetyIssue[];
} {
  const absFiles: string[] = [];
  for (const scope of ["packages", "apps"]) {
    collectSourceFiles(path.join(rootDir, scope), absFiles);
  }
  absFiles.sort();

  let tsDirectives = 0;
  let explicitAny = 0;
  let asUnknownAs = 0;
  let unknownDeclarations = 0;
  const files: Record<string, FileTypeSafetyCounts> = {};
  const issues: TypeSafetyIssue[] = [];

  for (const absPath of absFiles) {
    const relPath = path.relative(rootDir, absPath).replace(/\\/g, "/");
    const raw = fs.readFileSync(absPath, "utf8");
    const result = scanTypeSafetyInSource(raw, relPath);
    if (hasNonZeroCounts(result.counts)) {
      files[relPath] = result.counts;
      tsDirectives += result.counts.tsDirectives;
      explicitAny += result.counts.explicitAny;
      asUnknownAs += result.counts.asUnknownAs;
      unknownDeclarations += result.counts.unknownDeclarations;
      issues.push(...result.issues);
    }
  }

  return {
    totals: {
      tsDirectives,
      explicitAny,
      asUnknownAs,
      unknownDeclarations,
    },
    files,
    issues,
  };
}

/**
 * Đối chiếu kết quả quét hiện tại với baseline bậc thang chỉ giảm.
 * Bất kỳ file nào có số vi phạm lớn hơn baseline (hoặc file mới > 0) sẽ bị từ chối.
 */
export function verifyTypeSafetyAgainstBaseline(
  baseline: TypeSafetyBaseline,
  currentFiles: Record<string, FileTypeSafetyCounts>
): TypeSafetyVerdict {
  const regressions: string[] = [];
  const allFileKeys = Object.keys(currentFiles).sort();

  for (const file of allFileKeys) {
    const cur = currentFiles[file] ?? ZERO_COUNTS;
    const base = baseline.files[file] ?? ZERO_COUNTS;

    if (cur.tsDirectives > base.tsDirectives) {
      regressions.push(
        `[BR-TYP-01] ${file}: @ts-ignore/@ts-expect-error tăng (${base.tsDirectives} → ${cur.tsDirectives})`
      );
    }
    if (cur.explicitAny > base.explicitAny) {
      const rule = isTestFilePath(file) ? "BR-TYP-08" : "BR-TYP-01";
      regressions.push(
        `[${rule}] ${file}: any tường minh tăng (${base.explicitAny} → ${cur.explicitAny})`
      );
    }
    if (cur.asUnknownAs > base.asUnknownAs) {
      regressions.push(
        `[BR-TYP-02] ${file}: ép kiểu 'as unknown as' tăng (${base.asUnknownAs} → ${cur.asUnknownAs})`
      );
    }
    if (cur.unknownDeclarations > base.unknownDeclarations) {
      regressions.push(
        `[BR-TYP-03] ${file}: khai báo 'unknown' tăng (${base.unknownDeclarations} → ${cur.unknownDeclarations})`
      );
    }
  }

  return {
    ok: regressions.length === 0,
    regressions,
  };
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const isUpdate = process.argv.includes("--update");
  const isForce = process.argv.includes("--force");
  const baselinePath = path.join(
    repoPath(),
    "scripts/type-safety-baseline.json"
  );
  const scanned = scanRepoTypeSafety();

  if (isUpdate) {
    if (fs.existsSync(baselinePath) && !isForce) {
      const prev = JSON.parse(
        fs.readFileSync(baselinePath, "utf8")
      ) as TypeSafetyBaseline;
      const verdict = verifyTypeSafetyAgainstBaseline(prev, scanned.files);
      if (!verdict.ok) {
        console.error("✗ Từ chối nới type-safety-baseline.json:");
        for (const r of verdict.regressions) {
          console.error(`  - ${r}`);
        }
        process.exit(1);
      }
    }
    const payload: TypeSafetyBaseline = {
      totals: scanned.totals,
      files: scanned.files,
    };
    fs.writeFileSync(
      baselinePath,
      `${JSON.stringify(payload, null, 2)}\n`,
      "utf8"
    );
    console.log(
      `✓ Đã cập nhật scripts/type-safety-baseline.json (any=${scanned.totals.explicitAny}, unknown=${scanned.totals.unknownDeclarations}, asUnknownAs=${scanned.totals.asUnknownAs}, tsDirectives=${scanned.totals.tsDirectives})`
    );
    process.exit(0);
  }

  if (!fs.existsSync(baselinePath)) {
    console.error(
      "✗ Thiếu scripts/type-safety-baseline.json. Chạy với --update để khởi tạo."
    );
    process.exit(1);
  }

  const baseline = JSON.parse(
    fs.readFileSync(baselinePath, "utf8")
  ) as TypeSafetyBaseline;
  const verdict = verifyTypeSafetyAgainstBaseline(baseline, scanned.files);

  if (!verdict.ok) {
    console.error("✗ Cổng check-type-safety thất bại:");
    for (const r of verdict.regressions) {
      console.error(`  - ${r}`);
    }
    process.exit(1);
  }

  console.log(
    `✓ check-type-safety đạt chuẩn (any=${scanned.totals.explicitAny}/${baseline.totals.explicitAny}, unknown=${scanned.totals.unknownDeclarations}/${baseline.totals.unknownDeclarations}, asUnknownAs=${scanned.totals.asUnknownAs}/${baseline.totals.asUnknownAs})`
  );
  process.exit(0);
}
