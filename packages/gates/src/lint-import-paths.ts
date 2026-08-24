import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, repoPath } from "@mindkid/config/paths";
import {
  extractModuleSpecifiers,
  isExemptGeneratorSource,
} from "./import-graph.ts";
import { isFixturePath, walkSource } from "./lint-lib/source-scan.ts";

export interface ImportPathFinding {
  readonly file: string;
  readonly line: number;
  readonly specifier: string;
  readonly key: string;
  readonly reason: string;
}

const DEFAULT_SCAN_ROOTS = ["apps", "packages", "infra"].map((d) =>
  repoPath(d)
);
const DEBT_LEDGER_PATH = path.join(
  REPO_ROOT,
  "packages",
  "gates",
  "src",
  "import-path-debt.json"
);

const EXEMPT_MARKER = /lint-import-paths:\s*exempt\s+—/;

function isDocumentedExemption(relFile: string, spec: string): boolean {
  return (
    relFile === "packages/gates/tests/deploy.test.ts" &&
    spec === "../../../scripts/deploy/remote-exec.ts"
  );
}

function checkSpecifierViolation(
  relFile: string,
  line: number,
  spec: string
): ImportPathFinding | null {
  if (isDocumentedExemption(relFile, spec)) {
    return null;
  }

  if (spec.startsWith("../")) {
    return {
      file: relFile,
      line,
      specifier: spec,
      key: `${relFile}:${line}:${spec}`,
      reason: `Dùng parent-relative import "${spec}" thay vì alias canonical`,
    };
  }

  if (relFile.startsWith("apps/admin/") && spec.startsWith("@/")) {
    return {
      file: relFile,
      line,
      specifier: spec,
      key: `${relFile}:${line}:${spec}`,
      reason: `apps/admin dùng alias "${spec}" thay vì canonical "~/"`,
    };
  }

  return null;
}

function scanFileViolations(file: string, root: string): ImportPathFinding[] {
  const relFile = path.relative(root, file).split(path.sep).join("/");
  if (isExemptGeneratorSource(relFile, 0)) {
    return [];
  }
  const raw = fs.readFileSync(file, "utf8");
  if (EXEMPT_MARKER.test(raw)) {
    return [];
  }

  const findings: ImportPathFinding[] = [];
  const specs = extractModuleSpecifiers(raw);
  for (const { spec, line } of specs) {
    const violation = checkSpecifierViolation(relFile, line, spec);
    if (violation) {
      findings.push(violation);
    }
  }

  return findings;
}

export function findImportPathViolations(
  roots: readonly string[] = DEFAULT_SCAN_ROOTS,
  root: string = REPO_ROOT
): ImportPathFinding[] {
  const findings: ImportPathFinding[] = [];

  for (const scanDir of roots) {
    for (const file of walkSource(scanDir)) {
      if (isFixturePath(file, scanDir)) {
        continue;
      }
      findings.push(...scanFileViolations(file, root));
    }
  }

  return findings.sort((a, b) => a.key.localeCompare(b.key));
}

export function readImportPathDebt(): string[] {
  if (!fs.existsSync(DEBT_LEDGER_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(DEBT_LEDGER_PATH, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed)
    ? parsed.filter((s): s is string => typeof s === "string")
    : [];
}

export function writeImportPathDebt(debt: readonly string[]): void {
  fs.writeFileSync(
    DEBT_LEDGER_PATH,
    `${JSON.stringify([...debt].sort(), null, 2)}\n`,
    "utf8"
  );
}
