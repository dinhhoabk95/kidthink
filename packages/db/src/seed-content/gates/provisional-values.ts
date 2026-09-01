import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface ProvisionalEntry {
  readonly id: string;
  readonly tempValue: string;
  readonly usedIn: string;
  readonly reasonOrResult: string;
  readonly ownerTask: string;
  readonly deadline: string;
  readonly isClosed: boolean;
  readonly isOverdue: boolean;
}

export interface ProvisionalViolation {
  readonly file?: string;
  readonly line?: number;
  readonly rule:
    | "UNREGISTERED_PROVISIONAL_VALUE"
    | "OVERDUE_PROVISIONAL_VALUE"
    | "INVALID_PROVISIONAL_TABLE";
  readonly message: string;
}

export interface ProvisionalGateResult {
  readonly totalDocsScanned: number;
  readonly filesWithProvisionalMarker: readonly string[];
  readonly totalRegisteredEntries: number;
  readonly closedEntriesCount: number;
  readonly openEntriesCount: number;
  readonly violations: readonly ProvisionalViolation[];
}

const EXCLUDED_RELATIVE_PATHS: readonly string[] = [
  "tasks/provisional-values.md",
  "tasks/201-hasty-decision-audit-plan.md",
  "tasks/201-hasty-decision-audit-todo.md",
];

function isRowClosed(
  deadlineCol: string,
  reasonCol: string,
  idCol: string
): boolean {
  return (
    deadlineCol.includes("✔") ||
    deadlineCol.includes("đóng") ||
    deadlineCol.includes("closed") ||
    reasonCol.includes("Đã đóng") ||
    reasonCol.includes("Đã gỡ") ||
    idCol.includes("~~")
  );
}

function parseTableRow(
  columns: readonly string[],
  lineIndex: number
): { entry?: ProvisionalEntry; violation?: ProvisionalViolation } {
  if (columns.length < 6) {
    return {};
  }

  const idCol = columns[0] ?? "";
  const tempValueCol = columns[1] ?? "";
  const usedInCol = columns[2] ?? "";
  const reasonCol = columns[3] ?? "";
  const ownerTaskCol = columns[4] ?? "";
  const deadlineCol = columns[5] ?? "";

  const cleanId = idCol.replace(/~~/g, "").trim();
  const isClosed = isRowClosed(deadlineCol, reasonCol, idCol);
  const isOverdue =
    !isClosed &&
    (deadlineCol.toLowerCase().includes("quá hạn") ||
      deadlineCol.toLowerCase().includes("overdue"));

  const entry: ProvisionalEntry = {
    id: cleanId,
    tempValue: tempValueCol,
    usedIn: usedInCol,
    reasonOrResult: reasonCol,
    ownerTask: ownerTaskCol,
    deadline: deadlineCol,
    isClosed,
    isOverdue,
  };

  const violation: ProvisionalViolation | undefined = isOverdue
    ? {
        line: lineIndex + 1,
        rule: "OVERDUE_PROVISIONAL_VALUE",
        message: `Hàng số tạm [${cleanId}] bị quá hạn: "${deadlineCol}".`,
      }
    : undefined;

  return { entry, violation };
}

interface RawLineInfo {
  readonly line: string;
  readonly index: number;
}

function isTableDataRow(line: string): boolean {
  return line.startsWith("|") && !line.includes("---");
}

function extractTableLines(content: string): RawLineInfo[] {
  const tableLines: RawLineInfo[] = [];
  const lines = content.split("\n");
  let insideTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";
    if (line.startsWith("| # |") || line.startsWith("|#|")) {
      insideTable = true;
      continue;
    }
    if (!insideTable) {
      continue;
    }
    if (!line.startsWith("|")) {
      insideTable = false;
      continue;
    }
    if (isTableDataRow(line)) {
      tableLines.push({ line, index: i });
    }
  }

  return tableLines;
}

export function parseProvisionalValuesTable(content: string): {
  entries: ProvisionalEntry[];
  violations: ProvisionalViolation[];
} {
  const entries: ProvisionalEntry[] = [];
  const violations: ProvisionalViolation[] = [];

  const rawTableLines = extractTableLines(content);

  for (const { line, index } of rawTableLines) {
    const columns = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    const { entry, violation } = parseTableRow(columns, index);
    if (entry) {
      entries.push(entry);
    }
    if (violation) {
      violations.push(violation);
    }
  }

  if (entries.length === 0) {
    violations.push({
      rule: "INVALID_PROVISIONAL_TABLE",
      message: "Không tìm thấy bảng sổ số tạm hoặc bảng rỗng.",
    });
  }

  return { entries, violations };
}

function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findMarkdownFiles(fullPath));
      } else if (file.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  } catch {
    // Ignore unreadable directory
  }
  return results;
}

function checkFileProvisionalRegistration(
  relFromDocs: string,
  entries: readonly ProvisionalEntry[]
): boolean {
  return entries.some((entry) => {
    const usedIn = entry.usedIn;
    if (relFromDocs.includes("192-") && usedIn.includes("#192")) {
      return true;
    }
    if (
      relFromDocs.startsWith("specs/01-platform/engines/GT-") &&
      (usedIn.includes("9 phiếu engine") ||
        usedIn.includes("GT-028") ||
        usedIn.includes("GT-036") ||
        usedIn.includes("GT-"))
    ) {
      return true;
    }
    return (
      usedIn.includes(relFromDocs) ||
      relFromDocs.includes(usedIn.replace(/[`#]/g, ""))
    );
  });
}

function checkDocumentViolations(
  relFromDocs: string,
  content: string,
  entries: readonly ProvisionalEntry[]
): ProvisionalViolation[] {
  if (!content.includes("CHƯA ĐO")) {
    return [];
  }

  const isRegistered = checkFileProvisionalRegistration(relFromDocs, entries);
  if (isRegistered) {
    return [];
  }

  const fileViolations: ProvisionalViolation[] = [];
  const lines = content.split("\n");
  for (let l = 0; l < lines.length; l++) {
    const lineStr = lines[l];
    if (lineStr?.includes("CHƯA ĐO")) {
      fileViolations.push({
        file: relFromDocs,
        line: l + 1,
        rule: "UNREGISTERED_PROVISIONAL_VALUE",
        message: `Phát hiện nhãn "CHƯA ĐO" tại [${relFromDocs}:${l + 1}] nhưng chưa được đăng ký trong sổ.`,
      });
    }
  }
  return fileViolations;
}

export function scanDocsForProvisionalValues(
  docsDir: string,
  provisionalFilePath: string
): ProvisionalGateResult {
  const violations: ProvisionalViolation[] = [];
  const filesWithProvisionalMarker: string[] = [];

  let provisionalContent = "";
  try {
    provisionalContent = readFileSync(provisionalFilePath, "utf-8");
  } catch {
    violations.push({
      file: provisionalFilePath,
      rule: "INVALID_PROVISIONAL_TABLE",
      message: `Không đọc được file sổ số tạm: ${provisionalFilePath}`,
    });
    return {
      totalDocsScanned: 0,
      filesWithProvisionalMarker: [],
      totalRegisteredEntries: 0,
      closedEntriesCount: 0,
      openEntriesCount: 0,
      violations,
    };
  }

  const { entries, violations: tableViolations } =
    parseProvisionalValuesTable(provisionalContent);
  violations.push(...tableViolations);

  const allMdFiles = findMarkdownFiles(docsDir);

  for (const filePath of allMdFiles) {
    const relFromDocs = relative(docsDir, filePath);
    if (EXCLUDED_RELATIVE_PATHS.includes(relFromDocs)) {
      continue;
    }

    const content = readFileSync(filePath, "utf-8");
    if (content.includes("CHƯA ĐO")) {
      filesWithProvisionalMarker.push(relFromDocs);
    }

    violations.push(...checkDocumentViolations(relFromDocs, content, entries));
  }

  const closedEntriesCount = entries.filter((e) => e.isClosed).length;
  const openEntriesCount = entries.length - closedEntriesCount;

  return {
    totalDocsScanned: allMdFiles.length,
    filesWithProvisionalMarker,
    totalRegisteredEntries: entries.length,
    closedEntriesCount,
    openEntriesCount,
    violations,
  };
}

export function formatProvisionalReport(result: ProvisionalGateResult): string {
  const lines: string[] = [
    `Quét ${result.totalDocsScanned} file tài liệu trong docs/`,
    `Số file chứa "CHƯA ĐO": ${result.filesWithProvisionalMarker.length}`,
    `Tổng số hàng trong sổ: ${result.totalRegisteredEntries} (${result.closedEntriesCount} đã đóng, ${result.openEntriesCount} đang mở)`,
  ];

  if (result.violations.length > 0) {
    lines.push(`\n[VI PHẠM] Tìm thấy ${result.violations.length} vi phạm:`);
    for (const v of result.violations) {
      const loc = v.file ? `${v.file}${v.line ? `:${v.line}` : ""}` : "";
      lines.push(`- [${v.rule}] ${loc ? `(${loc}) ` : ""}${v.message}`);
    }
  } else {
    lines.push(
      "\n[XANH] Mọi giá trị tạm đều được đăng ký hợp lệ và không quá hạn."
    );
  }

  return lines.join("\n");
}
