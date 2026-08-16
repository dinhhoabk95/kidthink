import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * BR-GLOS-04 — one User type, no real-world role labels.
 *
 * `docs/specs` is already covered by lint:specs check C9. This gate covers the
 * other two surfaces BR-GLOS-03 names: code and UI. A label that survives in a
 * display string is the one users actually read, so it matters more than the
 * spec prose it came from.
 *
 * Vietnamese terms only. English `parent` is load-bearing in fixed identifiers
 * (`parent-gate`, `PARENT_GATE_REQUIRED`, `parent_gate_trusted_until`) and must
 * never be swept.
 */
const BANNED_TERMS = [/phụ\s+huynh/i, /giáo\s+viên/i];

const SCAN_ROOTS = ["apps", "packages"];
const SCAN_EXTENSIONS = [".ts", ".tsx", ".vue"];

const SKIP_DIRS = new Set([
  "node_modules",
  ".output",
  ".nuxt",
  ".cache",
  "dist",
  "migrations",
]);

/**
 * Emoji keywords describe the picture (👨‍🏫), not a kind of account. Stripping
 * them would break Vietnamese emoji search for no gain.
 */
const ALLOWLIST = new Set(["packages/emoji/src/data/profession.ts"]);

export interface VocabularyViolation {
  file: string;
  line: number;
  text: string;
}

export function scanContentForRoleLabels(
  rel: string,
  content: string
): VocabularyViolation[] {
  if (ALLOWLIST.has(rel)) {
    return [];
  }

  const violations: VocabularyViolation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (BANNED_TERMS.some((term) => term.test(line))) {
      violations.push({ file: rel, line: i + 1, text: line.trim() });
    }
  }

  return violations;
}

function collectFiles(dir: string, root: string, acc: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, root, acc);
      continue;
    }
    if (SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      acc.push(relative(root, full));
    }
  }
}

function main(): void {
  const root = process.cwd();
  const files: string[] = [];

  for (const scanRoot of SCAN_ROOTS) {
    const full = join(root, scanRoot);
    try {
      collectFiles(full, root, files);
    } catch {
      // A workspace root that does not exist yet is not a violation.
    }
  }

  const violations = files.flatMap((rel) =>
    scanContentForRoleLabels(rel, readFileSync(join(root, rel), "utf-8"))
  );

  if (violations.length > 0) {
    console.error(
      `❌ lint:user-vocabulary — ${violations.length} vi phạm BR-GLOS-04:`
    );
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.text}`);
    }
    console.error(
      "  Dùng: User · người lớn · người giám hộ · người dạy — docs/specs/00-foundation/glossary.md §7.4.1"
    );
    process.exit(1);
  }

  console.log(
    `✅ lint:user-vocabulary — ${files.length} file, 0 nhãn vai trò ngoài đời.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
