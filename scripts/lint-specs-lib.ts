/**
 * lint:specs library — pure checks + parsing, no CLI/process concerns.
 *
 * scripts/lint-specs.ts is the thin CLI entrypoint (collect real files, run
 * these checks, print, process.exit). This file exists so the checks are
 * importable and testable without running the whole corpus scan or hitting
 * process.exit — see scripts/tests/lint-specs.test.ts.
 *
 * C1  — 9 field frontmatter đủ, status hợp lệ
 * C2  — owns không trùng giữa hai spec
 * C3  — 11 section đúng thứ tự + đúng tên (07-addon = 7 section); tên sai warn
 * C4  — link .md nội bộ resolve
 * C5  — mã lỗi SCREAMING_SNAKE trong §8 có trong error-codes.md
 * C6  — BR-* ID không trùng, cột "vì sao" không rỗng
 * C7  — depends_on không chu trình (error kể từ Task #6, 2026-08-08 — trước đó
 *       chỉ warn, và 8 chu trình sống sót lặng lẽ tới lúc đó)
 * C8  — spec approved ⇒ depends_on cũng approved
 * C9  — cấm token: classification, tenant_id, cột role trên users, persona enum
 * C10 — cấm chữ CI / "cổng CI" / "GitHub Actions" (trừ strikethrough history)
 * C11 — số spec mỗi thư mục khớp SPEC.md §14 + index.md
 * C12 — bản đồ bảng DMO §7 ⟷ schema-* §7.x khớp hai chiều
 * C13 — mã ID trong spec khớp id-conventions §7 regex
 * C14 — cấm ký hiệu emoji trong văn xuôi (Task #4, nhận danh sách hoãn)
 * C15 — tên file spec trong backtick phải là liên kết (Task #4, nhận danh sách hoãn)
 */

/* biome-ignore-all lint/performance/useTopLevelRegex: script runs once, regex perf irrelevant */
/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: text-parsing checks are inherently complex */
/* biome-ignore-all lint/style/noNonNullAssertion: array index access after bounds check */
/* biome-ignore-all lint/suspicious/noAssignInExpressions: standard regex exec loop pattern */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import {
  buildBasenameMap,
  collectDocsFiles,
  computeSkipLines,
  findBareRefs,
  isDeferred,
  pickBestTarget,
  STYLE_DEFERRED,
  SYMBOLS,
} from "./style-guide.ts";

// ─── paths ───────────────────────────────────────────────────────────────────

export const ROOT = resolve(import.meta.dirname, "..");
export const DOCS_DIR = join(ROOT, "docs");
export const SPECS_DIR = join(ROOT, "docs", "specs");
export const SPEC_MD = join(ROOT, "docs", "SPEC.md");
export const INDEX_MD = join(SPECS_DIR, "index.md");
export const ERROR_CODES_MD = join(
  SPECS_DIR,
  "00-foundation",
  "error-codes.md"
);

// ─── types ───────────────────────────────────────────────────────────────────

export interface Violation {
  file: string;
  line: number;
  check: string;
  message: string;
}

export interface SpecFile {
  /** absolute path */
  path: string;
  /** relative to SPECS_DIR */
  rel: string;
  content: string;
  lines: string[];
  frontmatter: Record<string, unknown>;
  /** line number where frontmatter ends (1-indexed, the closing ---) */
  fmEndLine: number;
}

// ─── lint state ──────────────────────────────────────────────────────────────

const violations: Violation[] = [];
const warnings: Violation[] = [];

function fail(file: string, line: number, check: string, message: string) {
  violations.push({ file, line, check, message });
}

function warn(file: string, line: number, check: string, message: string) {
  warnings.push({ file, line, check, message });
}

/** Clear accumulated violations/warnings — call between test cases. */
export function resetLintState() {
  violations.length = 0;
  warnings.length = 0;
}

export function getViolations(): readonly Violation[] {
  return violations;
}

export function getWarnings(): readonly Violation[] {
  return warnings;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

export function parseFrontmatter(content: string): {
  data: Record<string, unknown>;
  endLine: number;
} {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") {
    return { data: {}, endLine: 0 };
  }

  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) {
    return { data: {}, endLine: 0 };
  }

  // Simple YAML parser for our flat frontmatter
  const data: Record<string, unknown> = {};
  let currentKey = "";
  let currentArray: string[] | null = null;

  for (let i = 1; i < endIdx; i++) {
    const line = lines[i]!;

    // Array item: "  - value"
    if (/^\s+-\s+/.test(line) && currentKey) {
      const val = line.replace(/^\s+-\s+/, "").trim();
      if (!currentArray) {
        currentArray = [];
      }
      currentArray.push(val);
      data[currentKey] = currentArray;
      continue;
    }

    // Key: value
    const match = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (match) {
      // Save previous array
      currentArray = null;
      currentKey = match[1]!;
      const rawVal = match[2]?.trim();

      if (rawVal === "" || rawVal === "[]") {
        data[currentKey] = rawVal === "[]" ? [] : undefined;
      } else if (rawVal === "true") {
        data[currentKey] = true;
      } else if (rawVal === "false") {
        data[currentKey] = false;
      } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
        // Inline array: [A, B]. Anchored at both ends — a scalar that merely
        // STARTS with "[" (e.g. `title: [Draft] Something`) is not an array
        // and must fall through to the plain-string branch below.
        data[currentKey] = rawVal
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (
        (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
        (rawVal.startsWith("'") && rawVal.endsWith("'"))
      ) {
        // Quoted scalar: "Foo: bar" or 'Foo: bar' — strip the wrapping quotes.
        data[currentKey] = rawVal.slice(1, -1);
      } else {
        data[currentKey] = rawVal;
      }
    }
  }

  return { data, endLine: endIdx + 1 };
}

/** Build a SpecFile from raw content — used by collectSpecFiles and tests. */
export function makeSpecFile(
  absPath: string,
  rel: string,
  content: string
): SpecFile {
  const { data, endLine } = parseFrontmatter(content);
  return {
    path: absPath,
    rel,
    content,
    lines: content.split("\n"),
    frontmatter: data,
    fmEndLine: endLine,
  };
}

export function collectSpecFiles(): SpecFile[] {
  const files: SpecFile[] = [];
  const areas = readdirSync(SPECS_DIR, { withFileTypes: true });

  for (const entry of areas) {
    if (!entry.isDirectory()) {
      continue;
    }
    // Only numbered area dirs: 00-foundation, 01-platform, etc.
    if (!/^\d{2}-/.test(entry.name)) {
      continue;
    }

    const areaDir = join(SPECS_DIR, entry.name);
    for (const f of readdirSync(areaDir)) {
      if (!f.endsWith(".md")) {
        continue;
      }
      const absPath = join(areaDir, f);
      const content = readFileSync(absPath, "utf-8");
      files.push(makeSpecFile(absPath, relative(SPECS_DIR, absPath), content));
    }
  }

  return files;
}

// ─── checks ──────────────────────────────────────────────────────────────────

export const REQUIRED_FIELDS = [
  "spec",
  "title",
  "area",
  "status",
  "mvp",
  "phase",
  "reviewed",
  "owns",
  "depends_on",
];
export const VALID_STATUS = ["draft", "approved", "implemented"];
export const VALID_AREA = [
  "foundation",
  "platform",
  "public",
  "account",
  "play",
  "content",
  "admin",
  "addon",
  "quality",
];

export function checkC1(specs: SpecFile[]) {
  for (const s of specs) {
    const fm = s.frontmatter;
    for (const field of REQUIRED_FIELDS) {
      if (fm[field] === undefined || fm[field] === null) {
        fail(s.rel, 1, "C1", `Missing frontmatter field: ${field}`);
      }
    }
    if (fm.status && !VALID_STATUS.includes(fm.status as string)) {
      fail(
        s.rel,
        1,
        "C1",
        `Invalid status: "${fm.status}" (expected: ${VALID_STATUS.join(", ")})`
      );
    }
    if (fm.area && !VALID_AREA.includes(fm.area as string)) {
      fail(
        s.rel,
        1,
        "C1",
        `Invalid area: "${fm.area}" (expected: ${VALID_AREA.join(", ")})`
      );
    }
  }
}

export function checkC2(specs: SpecFile[]) {
  const ownsMap = new Map<string, string[]>();
  for (const s of specs) {
    const owns = s.frontmatter.owns;
    if (!Array.isArray(owns)) {
      continue;
    }
    for (const item of owns) {
      const key = String(item).toLowerCase().trim();
      if (!ownsMap.has(key)) {
        ownsMap.set(key, []);
      }
      ownsMap.get(key)?.push(s.rel);
    }
  }
  for (const [item, files] of ownsMap) {
    if (files.length > 1) {
      for (const f of files) {
        fail(
          f,
          1,
          "C2",
          `Duplicate owns: "${item}" also claimed by ${files.filter((x) => x !== f).join(", ")}`
        );
      }
    }
  }
}

export const FULL_SECTIONS = [
  "1. Objective",
  "2. Actors",
  "3. Entry points",
  "4. Main flow",
  "5. Alternative flows",
  "6. Business rules",
  "7. Data",
  "8. API contract",
  "9. Acceptance criteria",
  "10. Boundaries",
  "11. Open questions",
];

export const ADDON_SECTIONS = [
  "1. Objective",
  "2. Actors",
  "6. Business rules",
  "7. Data",
  "8. API contract",
  "9. Acceptance criteria",
  "11. Open questions",
];

export function checkC3(specs: SpecFile[]) {
  for (const s of specs) {
    const isAddon = s.rel.startsWith("07-addon/");
    const expected = isAddon ? ADDON_SECTIONS : FULL_SECTIONS;

    // Find all ## N. headings
    const found: { num: string; title: string; line: number }[] = [];
    for (let i = 0; i < s.lines.length; i++) {
      const match = s.lines[i]?.match(/^##\s+(\d+)\.\s+(.*)/);
      if (match) {
        found.push({
          num: match[1]!,
          title: `${match[1]}. ${match[2]?.trim()}`,
          line: i + 1,
        });
      }
    }

    // Check expected sections present and in order
    let foundIdx = 0;
    for (const exp of expected) {
      const expNum = exp.split(".")[0]!;
      const matchIdx = found.findIndex(
        (f, i) => i >= foundIdx && f.num === expNum
      );
      if (matchIdx === -1) {
        fail(s.rel, 1, "C3", `Missing section: "## ${exp}"`);
        continue;
      }

      // Number matches, but the title text may have drifted (e.g. "## 5.
      // Vùng cấm" where convention expects "## 5. Alternative flows"). A
      // trailing "— extra context" suffix on the canonical name is fine;
      // a wholesale rename is not. Warning only — meta specs (glossary,
      // mvp-scope, ...) sometimes customize on purpose.
      const foundTitle = found[matchIdx]?.title ?? "";
      if (!foundTitle.startsWith(exp)) {
        warn(
          s.rel,
          found[matchIdx]?.line,
          "C3",
          `Section "## ${foundTitle}" — expected name "## ${exp}"`
        );
      }

      if (matchIdx < foundIdx) {
        fail(
          s.rel,
          found[matchIdx]?.line,
          "C3",
          `Section "## ${exp}" is out of order`
        );
      } else {
        foundIdx = matchIdx + 1;
      }
    }
  }
}

export function checkC4(specs: SpecFile[]) {
  // Check all spec files + SPEC.md + tasks + index.md etc.
  const allFiles = [
    ...specs.map((s) => ({ path: s.path, rel: s.rel, lines: s.lines })),
  ];

  // Also check meta-files in specs/
  for (const f of [
    "CONVENTIONS.md",
    "TEMPLATE.md",
    "index.md",
    "roadmap.md",
    "AUDIT-v1.md",
  ]) {
    const p = join(SPECS_DIR, f);
    if (existsSync(p)) {
      const content = readFileSync(p, "utf-8");
      allFiles.push({ path: p, rel: f, lines: content.split("\n") });
    }
  }

  // Add SPEC.md
  if (existsSync(SPEC_MD)) {
    const content = readFileSync(SPEC_MD, "utf-8");
    allFiles.push({
      path: SPEC_MD,
      rel: relative(join(ROOT, "docs"), SPEC_MD),
      lines: content.split("\n"),
    });
  }

  // Add docs/tasks/*.md (plan.md, todo.md, ...) — comment above already
  // claimed "+ tasks" but the scan was missing; broken links there went unchecked.
  const tasksDir = join(ROOT, "docs", "tasks");
  if (existsSync(tasksDir)) {
    for (const f of readdirSync(tasksDir)) {
      if (!f.endsWith(".md")) {
        continue;
      }
      const p = join(tasksDir, f);
      const content = readFileSync(p, "utf-8");
      allFiles.push({
        path: p,
        rel: relative(join(ROOT, "docs"), p),
        lines: content.split("\n"),
      });
    }
  }

  const linkPattern = /\]\(([^)#\s]+\.md)(?:#[^)]*)?\)/g;

  for (const file of allFiles) {
    for (let i = 0; i < file.lines.length; i++) {
      const line = file.lines[i]!;
      let match: RegExpExecArray | null;
      linkPattern.lastIndex = 0;

      while ((match = linkPattern.exec(line)) !== null) {
        const target = match[1]!;
        if (target.startsWith("http")) {
          continue;
        }

        const resolved = normalize(join(dirname(file.path), target));
        if (!existsSync(resolved)) {
          fail(file.rel, i + 1, "C4", `Broken link: ${target}`);
        }
      }
    }
  }
}

export function checkC5(specs: SpecFile[]) {
  // Build error code registry from error-codes.md
  const registeredCodes = new Set<string>();
  if (existsSync(ERROR_CODES_MD)) {
    const content = readFileSync(ERROR_CODES_MD, "utf-8");
    // Match SCREAMING_SNAKE in table cells: | `CODE_NAME` |
    const codePattern = /\|\s*`([A-Z][A-Z0-9_]+)`\s*\|/g;
    let match: RegExpExecArray | null;
    while ((match = codePattern.exec(content)) !== null) {
      registeredCodes.add(match[1]!);
    }
  }

  // Known non-error-code identifiers to skip
  const skipPatterns = new Set([
    "SCREAMING_SNAKE",
    "SCREAMING_SNAKE_CASE",
    "NULL",
    "TRUE",
    "FALSE",
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "JSONB",
    "JSON",
    "UUID",
    "TEXT",
    "BOOLEAN",
    "INTEGER",
    "BIGINT",
    "TIMESTAMP",
    "TIMESTAMPTZ",
    "DATE",
    "SERIAL",
    "VARCHAR",
    "NOT",
    "AND",
    "OR",
    "IN",
    "ON",
    "BY",
    "AS",
    "IS",
    "IF",
    "CREATE",
    "TABLE",
    "ALTER",
    "DROP",
    "INSERT",
    "UPDATE",
    "SELECT",
    "INDEX",
    "UNIQUE",
    "PRIMARY",
    "KEY",
    "FOREIGN",
    "REFERENCES",
    "CASCADE",
    "SET",
    "DEFAULT",
    "WHERE",
    "FROM",
    "JOIN",
    "LEFT",
    "RIGHT",
    "INNER",
    "OUTER",
    "GROUP",
    "ORDER",
    "LIMIT",
    "OFFSET",
    "HAVING",
    "DISTINCT",
    "BETWEEN",
    "LIKE",
    "ILIKE",
    "EXISTS",
    "NEVER",
    "ALWAYS",
    "NONE",
    "ALL",
    "ANY",
    "SPEC",
    "MVP",
    "DB",
    "API",
    "URL",
    "CSS",
    "HTML",
    "SEO",
    "PDF",
    "PNG",
    "JPEG",
    "SVG",
    "WEBP",
    "GIF",
    "MP4",
    "WEBM",
    "AWS",
    "SES",
    "SNS",
    "EC2",
    "S3",
    "IAM",
    "RDS",
    "VPC",
    "TOTP",
    "MFA",
    "OTP",
    "PIN",
    "SMS",
    "QR",
    "CORS",
    "CSP",
    "CSRF",
    "XSS",
    "HTTPS",
    "HTTP",
    "TLS",
    "SSL",
    "GDPR",
    "COPPA",
    "DPIA",
    "ENV",
    "NODE",
    "PNPM",
    "NPM",
    "NVM",
    "KB",
    "MB",
    "GB",
    "MS",
    "YYYY",
    "MM",
    "DD",
    "HH",
    "UTF",
    "ASCII",
    "TODO",
    "FIXME",
    "HACK",
    "NOTE",
    "XXX",
    "OK",
    "LGTM",
    "PR",
    "CI", // CI is checked by C10 separately
    "CONVENTION",
    "CONVENTIONS",
    "ROOT",
  ]);

  for (const s of specs) {
    // Find §8 section boundaries
    let in8 = false;
    for (let i = 0; i < s.lines.length; i++) {
      const line = s.lines[i]!;

      if (/^##\s+8\.\s+/.test(line)) {
        in8 = true;
        continue;
      }
      if (in8 && /^##\s+\d+\.\s+/.test(line)) {
        in8 = false;
        continue;
      }

      if (!in8) {
        continue;
      }

      // Find error code patterns in table rows (| STATUS | `CODE` |)
      const tableCodePattern = /\|\s*`([A-Z][A-Z0-9_]{2,})`\s*\|/g;
      let codeMatch: RegExpExecArray | null;
      while ((codeMatch = tableCodePattern.exec(line)) !== null) {
        const code = codeMatch[1]!;
        if (skipPatterns.has(code)) {
          continue;
        }
        // Must look like an error code: at least one underscore or known suffix
        if (
          !(code.includes("_") || code.endsWith("ED") || code.endsWith("ER"))
        ) {
          continue;
        }
        if (!registeredCodes.has(code)) {
          fail(
            s.rel,
            i + 1,
            "C5",
            `Error code "${code}" used in §8 but not in error-codes.md`
          );
        }
      }
    }
  }
}

export function checkC6(specs: SpecFile[]) {
  const allBrIds = new Map<string, { file: string; line: number }[]>();

  for (const s of specs) {
    for (let i = 0; i < s.lines.length; i++) {
      const line = s.lines[i]!;

      // Match BR table rows: | `BR-XXX-NN` | rule text | vì sao |
      // Anchored to column 1 — a BR-ID cited in the "vì sao" column as a
      // cross-reference (col 3) must NOT be mistaken for a second definition.
      //
      // `[^|]*` after the ID: column 1 often carries a short label after the
      // code (`| \`BR-ENG-01\` (thuần TS) |`) or a second related code
      // (`| \`BR-CDC-02\` \`BR-CDC-03\` |`). Requiring the cell to hold ONLY
      // the backticked code skipped 68 rows corpus-wide — measured 2026-08-08 —
      // which disabled BOTH checks below on them, in already-approved specs.
      // Staying inside `[^|]*` keeps the match anchored to column 1.
      const brMatch = line.match(/^\|\s*`(BR-[A-Z]+-\d+[a-z]?)`[^|]*\|/);
      if (!brMatch) {
        continue;
      }

      const brId = brMatch[1]!;

      // Track for duplicate check
      if (!allBrIds.has(brId)) {
        allBrIds.set(brId, []);
      }
      allBrIds.get(brId)?.push({ file: s.rel, line: i + 1 });

      // Check "vì sao" column (third column) is not empty.
      // A `| a | b |` row splits to 4 cells: ["", "a", "b", ""]. The trailing
      // "" is the text after the closing pipe, NOT a third column — so a
      // 2-column table (the `| Rule | Nội dung |` registry in
      // business-rules.md §7.3) read as "third column is empty" and produced
      // 23 bogus warnings, 13% of the corpus total. Measured 2026-08-08.
      // A genuine 3-column row splits to 5: ["", id, rule, vì sao, ""].
      const cells = line.split("|").map((c) => c.trim());
      // cells[0] = "", cells[1] = BR-ID, cells[2] = rule, cells[3] = vì sao
      if (cells.length >= 5) {
        const viSao = cells[3];
        if (!viSao || viSao === "" || viSao === "—" || viSao === "-") {
          warn(s.rel, i + 1, "C6", `BR rule "${brId}" missing "vì sao" column`);
        }
      }
    }
  }

  // Check duplicates (across different spec files — same file can reference same BR)
  // business-rules.md is a central REGISTRY — it lists all BR-IDs by design. Exclude it.
  const REGISTRY_FILE = "00-foundation/business-rules.md";
  for (const [brId, locations] of allBrIds) {
    // Group by file — only flag if same BR-ID appears in different DEFINING specs
    // BR definitions are in §6 (Business rules section). References elsewhere are OK.
    const definingFiles = new Set<string>();
    for (const loc of locations) {
      if (loc.file !== REGISTRY_FILE) {
        definingFiles.add(loc.file);
      }
    }
    if (definingFiles.size > 1) {
      // brMatch (above) is anchored to column 1, so every location here is a
      // real definition, never a "vì sao" cross-reference — genuine
      // duplicate definitions are a real corpus defect, not debt. Error.
      for (const loc of locations) {
        if (loc.file === REGISTRY_FILE) {
          continue;
        }
        fail(
          loc.file,
          loc.line,
          "C6",
          `Duplicate BR-ID "${brId}" — also defined in ${[...definingFiles].filter((f) => f !== loc.file).join(", ")}`
        );
      }
    }
  }
}

export function checkC7(specs: SpecFile[]) {
  // Build dependency graph from depends_on
  const graph = new Map<string, string[]>();
  const specToFile = new Map<string, SpecFile>();

  for (const s of specs) {
    const id = s.frontmatter.spec as string;
    if (!id) {
      continue;
    }
    specToFile.set(id, s);

    const deps = s.frontmatter.depends_on;
    if (Array.isArray(deps)) {
      graph.set(id, deps.map(String));
    } else {
      graph.set(id, []);
    }
  }

  // Standard DFS 3-color cycle detection
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  for (const id of graph.keys()) {
    color.set(id, WHITE);
  }

  const reportedCycles = new Set<string>();

  function dfs(node: string, path: string[]) {
    color.set(node, GRAY);
    path.push(node);

    for (const dep of graph.get(node) ?? []) {
      if (!graph.has(dep)) {
        continue; // external dep (e.g. CONVENTIONS)
      }
      const depColor = color.get(dep) ?? WHITE;
      if (depColor === GRAY) {
        // Found cycle: path from dep back to dep
        const cycleStart = path.indexOf(dep);
        const cycle = [...path.slice(cycleStart), dep];
        const cycleKey = cycle.slice().sort().join(",");
        if (!reportedCycles.has(cycleKey)) {
          reportedCycles.add(cycleKey);
          // fail(), not warn(): a cycle means every spec in it can never reach
          // `approved` (C8 blocks approved-depends-on-draft in both directions).
          // Task #6 (2026-08-08) found 8 live cycles that sat here silently as
          // warnings — this is promoted only after that corpus was cleaned to 0.
          fail(
            specToFile.get(node)?.rel ?? node,
            1,
            "C7",
            `Dependency cycle: ${cycle.join(" → ")}`
          );
        }
      } else if (depColor === WHITE) {
        dfs(dep, path);
      }
    }

    path.pop();
    color.set(node, BLACK);
  }

  for (const id of graph.keys()) {
    if (color.get(id) === WHITE) {
      dfs(id, []);
    }
  }
}

export function checkC8(specs: SpecFile[]) {
  const statusMap = new Map<string, string>();
  const specToFile = new Map<string, SpecFile>();

  for (const s of specs) {
    const id = s.frontmatter.spec as string;
    if (!id) {
      continue;
    }
    statusMap.set(id, s.frontmatter.status as string);
    specToFile.set(id, s);
  }

  for (const s of specs) {
    const id = s.frontmatter.spec as string;
    if (!id) {
      continue;
    }
    if (
      s.frontmatter.status !== "approved" &&
      s.frontmatter.status !== "implemented"
    ) {
      continue;
    }

    const deps = s.frontmatter.depends_on;
    if (!Array.isArray(deps)) {
      continue;
    }

    for (const dep of deps) {
      const depStr = String(dep);
      const depStatus = statusMap.get(depStr);
      // CONVENTIONS dependency (not a spec)
      if (!statusMap.has(depStr)) {
        continue;
      }
      if (depStatus !== "approved" && depStatus !== "implemented") {
        fail(
          s.rel,
          1,
          "C8",
          `Spec "${id}" is approved but depends_on "${depStr}" which is "${depStatus}"`
        );
      }
    }
  }
}

// NOTE: AGENTS.md also bans "cột role trên users" (a `role` column on the
// `users` table). Not encoded below — "role" and "users" are two independent
// words that can land far apart in a spec (different table, different
// section), so a line-level regex would either miss real violations or
// false-positive on unrelated "role" mentions (vai trò, user role trong mô
// tả UX, ...). Needs table/entity-aware parsing (which spec's §7 schema, on
// which table) that this line-scanner doesn't have. Left as a manual
// review item until C9 gains that context.
export const BANNED_TOKENS_C9 = [
  { pattern: /\bclassification\b/gi, name: "classification" },
  { pattern: /\btenant_id\b/gi, name: "tenant_id" },
  { pattern: /\bpersona\s+enum\b/gi, name: "persona enum" },
];

export function checkC9(specs: SpecFile[]) {
  // Lines that FORBID these tokens are OK — they define the ban itself.
  const negationCtx =
    /❌|không có|cấm|NEVER|bị cấm|vĩnh viễn ngoài|ngoài phạm vi|Không dùng|không .* enum|từ bị cấm|Banned|Must not|Ngoài phạm vi/i;

  for (const s of specs) {
    let inCodeBlock = false;
    let inBoundariesOrOQ = false;
    for (let i = 0; i < s.lines.length; i++) {
      const line = s.lines[i]!;
      // Skip frontmatter
      if (i + 1 <= s.fmEndLine) {
        continue;
      }
      // Track code blocks
      if (line.trimStart().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) {
        continue;
      }

      // Track §10 Boundaries and §11 Open questions (discuss bans, NOT violations)
      if (/^##\s+10\.\s+/.test(line) || /^##\s+11\.\s+/.test(line)) {
        inBoundariesOrOQ = true;
        continue;
      }
      if (/^##\s+\d+\.\s+/.test(line)) {
        inBoundariesOrOQ = false;
      }
      if (inBoundariesOrOQ) {
        continue;
      }

      // Skip lines that are BANNING/FORBIDDING these tokens
      if (negationCtx.test(line)) {
        continue;
      }
      // Look-back 3 lines for table context (e.g. "Ngoài phạm vi" header)
      let nearbyNegation = false;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        if (negationCtx.test(s.lines[j]!)) {
          nearbyNegation = true;
          break;
        }
      }
      if (nearbyNegation) {
        continue;
      }
      // Skip table header/separator rows
      if (/^\|[-\s|:]+\|$/.test(line.trim())) {
        continue;
      }

      for (const { pattern, name } of BANNED_TOKENS_C9) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          fail(s.rel, i + 1, "C9", `Banned token: "${name}"`);
        }
      }
    }
  }
}

export function checkC10(specs: SpecFile[]) {
  // Also check SPEC.md and index.md
  const allFiles: { path: string; rel: string; lines: string[] }[] = [
    ...specs.map((s) => ({ path: s.path, rel: s.rel, lines: s.lines })),
  ];

  for (const f of ["index.md", "roadmap.md"]) {
    const p = join(SPECS_DIR, f);
    if (existsSync(p)) {
      allFiles.push({
        path: p,
        rel: f,
        lines: readFileSync(p, "utf-8").split("\n"),
      });
    }
  }

  if (existsSync(SPEC_MD)) {
    allFiles.push({
      path: SPEC_MD,
      rel: relative(join(ROOT, "docs"), SPEC_MD),
      lines: readFileSync(SPEC_MD, "utf-8").split("\n"),
    });
  }

  const ciPatterns = [
    /\bCI\b/,
    /cổng CI/i,
    /GitHub Actions/i,
    /CI xanh/i,
    /CI đỏ/i,
  ];

  for (const file of allFiles) {
    let inCodeBlock = false;
    for (let i = 0; i < file.lines.length; i++) {
      const line = file.lines[i]!;

      // Track code blocks (same pattern as C9)
      if (line.trimStart().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) {
        continue;
      }
      // Skip strikethrough lines (closed history): ~~text~~
      if (/~~.*~~/.test(line)) {
        continue;
      }
      // Skip lines in §11 that are recording closed decisions
      if (/\*\*Đóng\s+\d{4}/.test(line)) {
        continue;
      }
      // Skip frontmatter
      if (line.trim() === "---") {
        continue;
      }

      for (const pat of ciPatterns) {
        if (pat.test(line)) {
          fail(
            file.rel,
            i + 1,
            "C10",
            `Banned wording: "${line.trim().slice(0, 80)}"`
          );
          break; // one per line
        }
      }
    }
  }
}

export function checkC11(_specs: SpecFile[]) {
  // Count actual files per area directory
  const actualCounts = new Map<string, number>();
  let totalActual = 0;

  const areas = readdirSync(SPECS_DIR, { withFileTypes: true });
  for (const entry of areas) {
    if (!(entry.isDirectory() && /^\d{2}-/.test(entry.name))) {
      continue;
    }
    const areaDir = join(SPECS_DIR, entry.name);
    const count = readdirSync(areaDir).filter((f) => f.endsWith(".md")).length;
    actualCounts.set(entry.name, count);
    totalActual += count;
  }

  // Parse index.md §Tổng table
  if (existsSync(INDEX_MD)) {
    const content = readFileSync(INDEX_MD, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      // Match: | `00-foundation` | 16 | 16 |  or  | **Tổng** | **130** | **120** |
      const areaMatch = line.match(/\|\s*`(\d{2}-\w+)`\s*\|\s*(\d+)\s*\|/);
      if (areaMatch) {
        const areaName = areaMatch[1]!;
        const indexCount = Number.parseInt(areaMatch[2]!, 10);
        const actual = actualCounts.get(areaName);
        if (actual !== undefined && actual !== indexCount) {
          fail(
            "index.md",
            i + 1,
            "C11",
            `index.md says ${areaName} has ${indexCount} specs but actual filesystem count is ${actual}`
          );
        }
      }

      // Total row
      const totalMatch = line.match(
        /\|\s*\*\*Tổng\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|/
      );
      if (totalMatch) {
        const indexTotal = Number.parseInt(totalMatch[1]!, 10);
        if (indexTotal !== totalActual) {
          fail(
            "index.md",
            i + 1,
            "C11",
            `index.md total is ${indexTotal} but actual filesystem count is ${totalActual}`
          );
        }
      }
    }
  }

  // Parse SPEC.md §14 tree
  if (existsSync(SPEC_MD)) {
    const content = readFileSync(SPEC_MD, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      // Match: "**124 spec module.**" or "**130 spec module.**"
      const totalSpecMatch = line.match(/\*\*(\d+)\s+spec\s+module/);
      if (totalSpecMatch) {
        const specTotal = Number.parseInt(totalSpecMatch[1]!, 10);
        if (specTotal !== totalActual) {
          fail(
            "SPEC.md",
            i + 1,
            "C11",
            `SPEC.md says ${specTotal} spec module but actual filesystem count is ${totalActual}`
          );
        }
      }

      // Match tree lines: "├── 00-foundation/  14"
      const treeMatch = line.match(/[├└]── (\d{2}-\w+)\/\s+(\d+)/);
      if (treeMatch) {
        const areaName = treeMatch[1]!;
        const treeCount = Number.parseInt(treeMatch[2]!, 10);
        const actual = actualCounts.get(areaName);
        if (actual !== undefined && actual !== treeCount) {
          fail(
            "SPEC.md",
            i + 1,
            "C11",
            `SPEC.md §14 says ${areaName} has ${treeCount} specs but actual filesystem count is ${actual}`
          );
        }
      }
    }
  }
}

// ─── C12 — bản đồ bảng DMO ⟷ schema-* khớp hai chiều ─────────────────────

const DMO_MD = join(SPECS_DIR, "01-platform", "data-model-overview.md");
const SCHEMA_SPECS = [
  "01-platform/schema-identity-billing.md",
  "01-platform/schema-content-taxonomy.md",
  "01-platform/schema-play-telemetry.md",
];

/**
 * C12 — cross-check table names between data-model-overview §7 and schema-* §7.x.
 *
 * DMO §7 has a table: | Module | Bảng | Spec chi tiết |
 * Each `Bảng` cell lists backticked table names.
 *
 * Each schema-* has §7.x subsections: ### 7.N `table_name`
 * or ### 7.Na `table_name` — ...
 *
 * C12 fails if:
 * - A table appears in schema-* §7.x but NOT in DMO §7 Bảng column
 * - A table appears in DMO §7 Bảng column pointing to a schema-* spec, but that
 *   schema-* doesn't define it in its §7.x
 */
export function checkC12(_specs: SpecFile[]) {
  if (!existsSync(DMO_MD)) {
    return;
  }

  // 1) Extract tables from DMO §7: each row maps spec → set of table names
  const dmoContent = readFileSync(DMO_MD, "utf-8");
  const dmoLines = dmoContent.split("\n");
  const dmoTables = new Map<string, Set<string>>(); // specRel → tables
  const dmoTableToLine = new Map<string, number>(); // table → line in DMO

  let inSection7 = false;
  for (let i = 0; i < dmoLines.length; i++) {
    const line = dmoLines[i]!;
    if (/^## 7\.\s+/.test(line)) {
      inSection7 = true;
      continue;
    }
    if (inSection7 && /^## \d+\.\s+/.test(line)) {
      break;
    }
    if (!inSection7) {
      continue;
    }

    // Match table rows: | `module` | `table1` `table2` ... | `spec-name` |
    // Skip subsection headers (### 7.x ...)
    if (line.startsWith("###")) {
      break; // table is before subsections
    }

    // Parse main §7 table rows
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) {
      continue;
    }
    const tablesCell = cells[2]; // Bảng column
    const specCell = cells[3]; // Spec chi tiết column
    if (!(tablesCell && specCell)) {
      continue;
    }

    // Extract backticked table names from Bảng cell
    const tableNames: string[] = [];
    const tablePattern = /`(\w+)`/g;
    let m: RegExpExecArray | null;
    while ((m = tablePattern.exec(tablesCell)) !== null) {
      tableNames.push(m[1]!);
      dmoTableToLine.set(m[1]!, i + 1);
    }

    // Extract spec file reference from Spec chi tiết cell
    // Three formats:
    //   1. `schema-identity-billing` (backticked, no extension)
    //   2. [`schema-identity-billing.md`](schema-identity-billing.md) (link with backticked text)
    //   3. [schema-identity-billing.md](schema-identity-billing.md) (link with plain text)
    //   4. "idem" (same as previous)
    const specMatch =
      specCell.match(/`(schema-[\w-]+)(?:\.md)?`/) ??
      specCell.match(/\[`?(schema-[\w-]+)(?:\.md)?`?\]\([^)]+\)/);
    let specRel: string | undefined;
    if (specMatch) {
      specRel = `01-platform/${specMatch[1]}.md`;
    } else if (specCell.toLowerCase() === "idem" && dmoTables.size > 0) {
      // Use the last spec
      specRel = [...dmoTables.keys()].at(-1);
    }

    if (specRel && tableNames.length > 0) {
      if (!dmoTables.has(specRel)) {
        dmoTables.set(specRel, new Set());
      }
      for (const t of tableNames) {
        dmoTables.get(specRel)!.add(t);
      }
    }
  }

  // 2) Extract tables from each schema-* §7.x sections
  //
  // Three patterns:
  // A) ### 7.1 `users` → table name in header
  // B) ### 7.6 `packages` · `package_entitlements` → multi-table header
  // C) ### 7.3 Bảng auth phụ — polymorphic
  //    | Bảng | Cột đặc thù |
  //    | `active_sessions` | ... |
  //    → table names in body table with `Bảng` column
  //
  // Skip: ### 7.10 Module `ops` → "ops" is a module name, not a table
  const schemaTables = new Map<string, Set<string>>(); // specRel → tables

  for (const specRel of SCHEMA_SPECS) {
    const specPath = join(SPECS_DIR, specRel);
    if (!existsSync(specPath)) {
      continue;
    }
    const content = readFileSync(specPath, "utf-8");
    const lines = content.split("\n");
    const tables = new Set<string>();

    let inSection7 = false;
    let inBodyTable = false; // inside a body table with Bảng column
    let bangColIdx = -1; // index of the Bảng column

    for (const line of lines) {
      // Track §7 boundaries
      if (/^## 7\.\s+/.test(line)) {
        inSection7 = true;
        continue;
      }
      if (inSection7 && /^## \d+\.\s+/.test(line)) {
        break; // left §7
      }
      if (!inSection7) {
        continue;
      }

      // Pattern A/B: ### 7.x header
      if (/^###\s+7\.\d+[a-z]?\s+/.test(line)) {
        inBodyTable = false;
        bangColIdx = -1;

        // Skip "Module `X`" pattern — module names aren't tables
        if (/^###\s+7\.\d+[a-z]?\s+Module\s+/.test(line)) {
          // But we expect body table below this header
          continue;
        }

        // Extract backticked table names from header
        const headerTablePattern = /`(\w+)`/g;
        let hm: RegExpExecArray | null;
        while ((hm = headerTablePattern.exec(line)) !== null) {
          const name = hm[1]!;
          // Table names are lowercase snake_case
          if (/^[a-z][a-z0-9_]+$/.test(name) && name.length > 2) {
            tables.add(name);
          }
        }
        continue;
      }

      // Pattern C: detect body table with Bảng column
      // Table header row: | Bảng | Cột | ...
      if (/^\|\s*Bảng\s*\|/.test(line)) {
        inBodyTable = true;
        // Find which column index has "Bảng"
        const headerCells = line.split("|").map((c) => c.trim());
        bangColIdx = headerCells.indexOf("Bảng");
        continue;
      }

      // Table separator row
      if (inBodyTable && /^\|[-\s|:]+\|$/.test(line.trim())) {
        continue;
      }

      // Table data row
      if (inBodyTable && line.startsWith("|")) {
        const cells = line.split("|").map((c) => c.trim());
        if (bangColIdx >= 0 && bangColIdx < cells.length) {
          const bangCell = cells[bangColIdx]!;
          const cellTableMatch = bangCell.match(/`(\w+)`/);
          if (cellTableMatch) {
            const name = cellTableMatch[1]!;
            if (/^[a-z][a-z0-9_]+$/.test(name) && name.length > 2) {
              tables.add(name);
            }
          }
        }
        continue;
      }

      // End of body table (non-table line)
      if (inBodyTable) {
        inBodyTable = false;
        bangColIdx = -1;
      }
    }

    schemaTables.set(specRel, tables);
  }

  // 3) Cross-check both directions
  // Direction 1: tables in schema-* but not in DMO
  for (const [specRel, tables] of schemaTables) {
    const dmoSet = dmoTables.get(specRel) ?? new Set();
    for (const table of tables) {
      if (!dmoSet.has(table)) {
        fail(
          specRel,
          1,
          "C12",
          `Table "${table}" defined in §7.x but missing from data-model-overview §7`
        );
      }
    }
  }

  // Direction 2: tables in DMO pointing to a schema-* but not defined there
  for (const [specRel, tables] of dmoTables) {
    if (!SCHEMA_SPECS.includes(specRel)) {
      continue; // skip non-schema specs
    }
    const schemaSet = schemaTables.get(specRel) ?? new Set();
    for (const table of tables) {
      if (!schemaSet.has(table)) {
        const line = dmoTableToLine.get(table) ?? 1;
        fail(
          relative(SPECS_DIR, DMO_MD),
          line,
          "C12",
          `Table "${table}" listed in DMO §7 for ${specRel} but not defined in that spec's §7.x`
        );
      }
    }
  }
}

// ─── C13 — mã ID khớp id-conventions §7 regex ──────────────────────────────

const ID_CONVENTIONS_MD = join(SPECS_DIR, "00-foundation", "id-conventions.md");

interface IdConvention {
  prefix: string;
  regex: string;
  example: string;
  line: number;
}

/**
 * C13 — validate ID code formats against id-conventions §7.
 *
 * (a) Each `ví dụ` (example) in §7.1 table must match its own `regex`.
 * (b) Every literal code in corpus matching a known prefix must match
 *     the regex for that prefix.
 */
export function checkC13(specs: SpecFile[]) {
  if (!existsSync(ID_CONVENTIONS_MD)) {
    return;
  }

  const content = readFileSync(ID_CONVENTIONS_MD, "utf-8");
  const lines = content.split("\n");

  // Parse §7.1 table
  const conventions: IdConvention[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Find the table header: | Loại | Tiền tố | Regex | Ví dụ | Lớp |
    if (/^\|\s*Loại\s*\|/.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable && /^\|[-\s|:]+\|$/.test(line.trim())) {
      continue; // separator row
    }
    if (inTable && !line.startsWith("|")) {
      inTable = false;
      continue;
    }
    if (!inTable) {
      continue;
    }

    // Parse row: | Loại | `prefix` | `regex` | `example` | layer |
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 6) {
      continue;
    }

    const prefixCell = cells[2]!; // Tiền tố
    const regexCell = cells[3]!; // Regex
    const exampleCell = cells[4]!; // Ví dụ

    // Extract values from backticks
    const prefixMatch = prefixCell.match(/`([^`]+)`/);
    const regexMatch = regexCell.match(/`([^`]+)`/);
    const exampleMatch = exampleCell.match(/`([^`]+)`/);

    if (!(regexMatch && exampleMatch)) {
      continue;
    }

    const prefix = prefixMatch ? prefixMatch[1]! : "";
    const regex = regexMatch[1]!;
    const example = exampleMatch[1]!;

    conventions.push({ prefix, regex, example, line: i + 1 });
  }

  // (a) Check each example matches its own regex
  for (const conv of conventions) {
    try {
      const re = new RegExp(conv.regex);
      if (!re.test(conv.example)) {
        fail(
          "00-foundation/id-conventions.md",
          conv.line,
          "C13",
          `Example "${conv.example}" does not match its own regex ${conv.regex}`
        );
      }
    } catch {
      warn(
        "00-foundation/id-conventions.md",
        conv.line,
        "C13",
        `Invalid regex: ${conv.regex}`
      );
    }
  }

  // (b) Find literal codes in corpus matching known prefixes
  // Build prefix → regex map for prefixes that start a code
  // Sort by prefix length descending so CUR- matches before C
  const prefixRegexMap: { prefix: string; regex: RegExp; raw: string }[] = [];
  for (const conv of conventions) {
    if (!conv.prefix) {
      continue; // skip entries without explicit prefix (Strand, Skill, etc.)
    }
    // Skip single-char prefix "C" for corpus scan — too many false positives
    // (C1, C2 etc. are competency codes but CUR-01 starts with C too)
    // Competency codes are validated via their own regex in part (a)
    if (conv.prefix.length <= 1) {
      continue;
    }
    try {
      prefixRegexMap.push({
        prefix: conv.prefix,
        regex: new RegExp(conv.regex),
        raw: conv.regex,
      });
    } catch {
      // skip invalid regex
    }
  }

  // Sort longest prefix first to avoid CUR- matching as C
  prefixRegexMap.sort((a, b) => b.prefix.length - a.prefix.length);

  // Scan all specs for literal code patterns
  // Match both backticked and non-backticked codes:
  //   `GL-C1-CNT-MATCH-0007` or "G-04021" or bare GT-xxx
  // Exclude BR-* rule IDs (e.g. BR-ACT-07 should not match as ACT-07)
  const codeLiteralPattern =
    /(?<![A-Z-])(?:`|"|'|\b)((?:GL?-|GT-|LO-|LES-|ACT-|CUR-|WS-|PKG-|EMJ-)[\w.-]+)(?:`|"|'|\b)/g;

  // Track already-reported codes per file+line to avoid duplicates
  const reported = new Set<string>();

  for (const s of specs) {
    for (let i = 0; i < s.lines.length; i++) {
      const line = s.lines[i]!;
      // Skip frontmatter
      if (i + 1 <= s.fmEndLine) {
        continue;
      }
      // Skip id-conventions itself (it defines the patterns)
      if (s.rel === "00-foundation/id-conventions.md") {
        continue;
      }

      codeLiteralPattern.lastIndex = 0;
      let cm: RegExpExecArray | null;
      while ((cm = codeLiteralPattern.exec(line)) !== null) {
        const code = cm[1]!;
        const reportKey = `${s.rel}:${i + 1}:${code}`;
        if (reported.has(reportKey)) {
          continue;
        }

        // Find which prefix this matches
        for (const { prefix, regex, raw } of prefixRegexMap) {
          if (code.startsWith(prefix)) {
            if (!regex.test(code)) {
              reported.add(reportKey);
              fail(
                s.rel,
                i + 1,
                "C13",
                `Code literal "${code}" has prefix "${prefix}" but does not match regex ${raw}`
              );
            }
            break;
          }
        }
      }
    }
  }
}

// ─── C14 — cấm ký hiệu emoji trong văn xuôi ─────────────────────────────────
//
// Task #4 — docs/tasks/04-readability-spec.md mục 5.1. Quét toàn bộ docs/,
// bỏ khối mã và frontmatter (computeSkipLines, dùng chung với C9/C10). Bỏ
// qua file/thư mục còn trong danh sách hoãn STYLE_DEFERRED — mỗi đợt viết
// lại xong một khu vực thì xoá khu vực đó khỏi danh sách, cùng commit với
// nội dung đã sửa (xem quyết định thiết kế 1 của plan.md).

/**
 * docs/ thật (collectDocsFiles) cộng thêm bất kỳ spec TỔNG HỢP trong `specs`
 * chưa có mặt trên đĩa — cách unit test tiêm được một file giả (đường dẫn
 * kiểu "fake/test-c14.md") mà không đếm hai lần 130 spec thật khi chạy CLI
 * thật (ở đó `specs` chính là collectSpecFiles(), đã có sẵn trên đĩa).
 */
function collectDocsFilesWithSynthetic(
  specs: SpecFile[]
): { rel: string; abs: string; lines: string[] }[] {
  const real = collectDocsFiles(DOCS_DIR);
  const realRels = new Set(real.map((f) => f.rel));
  const synthetic = specs
    .map((s) => ({ rel: `specs/${s.rel}`, abs: s.path, lines: s.lines }))
    .filter((f) => !realRels.has(f.rel));
  return [...real, ...synthetic];
}

export function checkC14(specs: SpecFile[]) {
  const files = collectDocsFilesWithSynthetic(specs);
  for (const f of files) {
    if (isDeferred(f.rel, STYLE_DEFERRED)) {
      continue;
    }
    const skip = computeSkipLines(f.lines);
    for (let i = 0; i < f.lines.length; i++) {
      if (skip[i]) {
        continue;
      }
      const line = f.lines[i] ?? "";
      // Một fail() cho MỖI lượt ký hiệu, không gộp theo dòng — mục 5.1 của
      // 04-readability-spec.md kỳ vọng số vi phạm khớp đúng tổng "vị trí"
      // (occurrence) đo được ở scripts/inventory-symbols.ts, không phải số
      // dòng có ký hiệu.
      for (const { char, name } of SYMBOLS) {
        let idx = line.indexOf(char);
        while (idx !== -1) {
          fail(f.rel, i + 1, "C14", `Ký hiệu cấm trong văn xuôi: ${name}`);
          idx = line.indexOf(char, idx + char.length);
        }
      }
    }
  }
}

// ─── C15 — tên file spec trong backtick phải là liên kết ────────────────────
//
// Task #4 — mục 5.1. Chuỗi trong backtick khớp basename một file thật dưới
// docs/, không nằm trong cú pháp liên kết markdown `[`tên`](đường-dẫn)` ⇒
// lỗi, kèm đường dẫn tương đối nên dùng (pickBestTarget xử lý ca basename
// trùng như "index").

export function checkC15(specs: SpecFile[]) {
  const files = collectDocsFilesWithSynthetic(specs);
  const basenameMap = buildBasenameMap(files);
  const knownBasenames = new Set(basenameMap.keys());

  for (const f of files) {
    if (isDeferred(f.rel, STYLE_DEFERRED)) {
      continue;
    }
    const skip = computeSkipLines(f.lines);
    for (let i = 0; i < f.lines.length; i++) {
      if (skip[i]) {
        continue;
      }
      const line = f.lines[i] ?? "";
      const bareRefs = findBareRefs(line, knownBasenames);
      for (const ref of bareRefs) {
        const candidates = basenameMap.get(ref.candidate) ?? [];
        const targetRel = pickBestTarget(candidates, f.rel);
        const suggested = relative(dirname(f.abs), join(DOCS_DIR, targetRel));
        fail(
          f.rel,
          i + 1,
          "C15",
          `Tham chiếu trần "${ref.raw}" — dùng liên kết tới ${suggested}`
        );
      }
    }
  }
}

export const ALL_CHECKS = [
  checkC1,
  checkC2,
  checkC3,
  checkC4,
  checkC5,
  checkC6,
  checkC7,
  checkC8,
  checkC9,
  checkC10,
  checkC11,
  checkC12,
  checkC13,
  checkC14,
  checkC15,
];
