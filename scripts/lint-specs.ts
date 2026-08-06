/**
 * lint:specs — kiểm corpus specification theo CONVENTIONS.md §10.
 *
 * SPEC.md §7: một trong năm bước của `pnpm check`.
 * 11 check, mỗi cái bắt một loại lỗi. Lỗi in `file:line` + tên check.
 * Exit 1 nếu có bất kỳ vi phạm nào.
 *
 * C1  — 9 field frontmatter đủ, status hợp lệ
 * C2  — owns không trùng giữa hai spec
 * C3  — 11 section đúng thứ tự (07-addon = 7 section)
 * C4  — link .md nội bộ resolve
 * C5  — mã lỗi SCREAMING_SNAKE trong §8 có trong error-codes.md
 * C6  — BR-* ID không trùng, cột "vì sao" không rỗng
 * C7  — depends_on không chu trình
 * C8  — spec approved ⇒ depends_on cũng approved
 * C9  — cấm token: classification, tenant_id, cột role trên users, persona enum
 * C10 — cấm chữ CI / "cổng CI" / "GitHub Actions" (trừ strikethrough history)
 * C11 — số spec mỗi thư mục khớp SPEC.md §14 + index.md
 */

/* biome-ignore-all lint/performance/useTopLevelRegex: script runs once, regex perf irrelevant */
/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: text-parsing checks are inherently complex */
/* biome-ignore-all lint/style/noNonNullAssertion: array index access after bounds check */
/* biome-ignore-all lint/suspicious/noAssignInExpressions: standard regex exec loop pattern */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";

// ─── paths ───────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, "..");
const SPECS_DIR = join(ROOT, "docs", "specs");
const SPEC_MD = join(ROOT, "docs", "SPEC.md");
const INDEX_MD = join(SPECS_DIR, "index.md");
const ERROR_CODES_MD = join(SPECS_DIR, "00-foundation", "error-codes.md");

// ─── types ───────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  check: string;
  message: string;
}

interface SpecFile {
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

// ─── helpers ─────────────────────────────────────────────────────────────────

const violations: Violation[] = [];

function fail(file: string, line: number, check: string, message: string) {
  violations.push({ file, line, check, message });
}

function parseFrontmatter(content: string): {
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
      } else if (rawVal.startsWith("[")) {
        // Inline array: [A, B]
        data[currentKey] = rawVal
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        data[currentKey] = rawVal;
      }
    }
  }

  return { data, endLine: endIdx + 1 };
}

function collectSpecFiles(): SpecFile[] {
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
      const { data, endLine } = parseFrontmatter(content);
      files.push({
        path: absPath,
        rel: relative(SPECS_DIR, absPath),
        content,
        lines: content.split("\n"),
        frontmatter: data,
        fmEndLine: endLine,
      });
    }
  }

  return files;
}

// ─── checks ──────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
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
const VALID_STATUS = ["draft", "approved", "implemented"];
const VALID_AREA = [
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

function checkC1(specs: SpecFile[]) {
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

function checkC2(specs: SpecFile[]) {
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

const FULL_SECTIONS = [
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

const ADDON_SECTIONS = [
  "1. Objective",
  "2. Actors",
  "6. Business rules",
  "7. Data",
  "8. API contract",
  "9. Acceptance criteria",
  "11. Open questions",
];

function checkC3(specs: SpecFile[]) {
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
      } else if (matchIdx < foundIdx) {
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

function checkC4(specs: SpecFile[]) {
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

function checkC5(specs: SpecFile[]) {
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

  // For each spec, find error codes in §8 (API contract) section
  const _errorCodePattern = /`([A-Z][A-Z0-9_]{2,})`/g;
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

function checkC6(specs: SpecFile[]) {
  const allBrIds = new Map<string, { file: string; line: number }[]>();

  for (const s of specs) {
    for (let i = 0; i < s.lines.length; i++) {
      const line = s.lines[i]!;

      // Match BR table rows: | `BR-XXX-NN` | rule text | vì sao |
      const brMatch = line.match(/\|\s*`(BR-[A-Z]+-\d+)`\s*\|/);
      if (!brMatch) {
        continue;
      }

      const brId = brMatch[1]!;

      // Track for duplicate check
      if (!allBrIds.has(brId)) {
        allBrIds.set(brId, []);
      }
      allBrIds.get(brId)?.push({ file: s.rel, line: i + 1 });

      // Check "vì sao" column (third column) is not empty
      // Split by |, expect at least 4 segments (leading empty, col1, col2, col3)
      const cells = line.split("|").map((c) => c.trim());
      // cells[0] = "", cells[1] = BR-ID, cells[2] = rule, cells[3] = vì sao
      if (cells.length >= 4) {
        const viSao = cells[3];
        if (!viSao || viSao === "" || viSao === "—" || viSao === "-") {
          fail(s.rel, i + 1, "C6", `BR rule "${brId}" missing "vì sao" column`);
        }
      }
    }
  }

  // Check duplicates (across different spec files — same file can reference same BR)
  for (const [brId, locations] of allBrIds) {
    // Group by file — only flag if same BR-ID appears in different DEFINING specs
    // BR definitions are in §6 (Business rules section). References elsewhere are OK.
    const definingFiles = new Set<string>();
    for (const loc of locations) {
      definingFiles.add(loc.file);
    }
    if (definingFiles.size > 1) {
      // Check if it's in §6 of multiple files (actual duplicate definition)
      for (const loc of locations) {
        fail(
          loc.file,
          loc.line,
          "C6",
          `Duplicate BR-ID "${brId}" — also in ${[...definingFiles].filter((f) => f !== loc.file).join(", ")}`
        );
      }
    }
  }
}

function checkC7(specs: SpecFile[]) {
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
          const specFile = specToFile.get(cycle[0]!);
          fail(
            specFile?.rel ?? "unknown",
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

function checkC8(specs: SpecFile[]) {
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

const BANNED_TOKENS_C9 = [
  { pattern: /\bclassification\b/gi, name: "classification" },
  { pattern: /\btenant_id\b/gi, name: "tenant_id" },
  { pattern: /\bpersona\s+enum\b/gi, name: "persona enum" },
];

function checkC9(specs: SpecFile[]) {
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

function checkC10(specs: SpecFile[]) {
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
    for (let i = 0; i < file.lines.length; i++) {
      const line = file.lines[i]!;

      // Skip strikethrough lines (closed history): ~~text~~
      if (/~~.*~~/.test(line)) {
        continue;
      }
      // Skip lines in §11 that are recording closed decisions
      if (/\*\*Đóng\s+\d{4}/.test(line)) {
        continue;
      }
      // Skip code blocks
      if (line.trimStart().startsWith("```")) {
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

function checkC11(_specs: SpecFile[]) {
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
            `index.md says ${areaName} has ${indexCount} specs but actual is ${actual}`
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
            `index.md total is ${indexTotal} but actual is ${totalActual}`
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
            `SPEC.md says ${specTotal} spec module but actual is ${totalActual}`
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
            `SPEC.md §14 says ${areaName} has ${treeCount} specs but actual is ${actual}`
          );
        }
      }
    }
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

const specs = collectSpecFiles();

checkC1(specs);
checkC2(specs);
checkC3(specs);
checkC4(specs);
checkC5(specs);
checkC6(specs);
checkC7(specs);
checkC8(specs);
checkC9(specs);
checkC10(specs);
checkC11(specs);

if (violations.length === 0) {
  console.log(`✅ lint:specs — ${specs.length} specs, 11 checks, 0 violations`);
  process.exit(0);
} else {
  console.error(`❌ lint:specs — ${violations.length} violation(s):\n`);
  // Sort by check then file
  violations.sort(
    (a, b) =>
      a.check.localeCompare(b.check) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.check}]  ${v.message}`);
  }
  console.error();
  process.exit(1);
}
