import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, repoPath } from "@mindkid/config/paths";
import {
  extractModuleSpecifiers,
  isExemptGeneratorSource,
  resolveTarget,
} from "#src/import-graph";
import {
  findImportPathViolations,
  writeImportPathDebt,
} from "#src/lint-import-paths";
import { isFixturePath, walkSource } from "#src/lint-lib/source-scan";

export interface RewriteResult {
  readonly file: string;
  readonly changed: boolean;
  readonly rewrites: Array<{ line: number; from: string; to: string }>;
}

export interface CrossWorkspaceFinding {
  readonly file: string;
  readonly line: number;
  readonly fromSpec: string;
  readonly target: string;
}

const EXT_REGEX = /\.(?:[cm]?[jt]s)$/;
const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
const TARGET_PKG_REGEX = /^packages\/([^/]+)\/(.*)$/;
const FILE_PKG_REGEX = /^packages\/([^/]+)\//;

function escapeRegExp(s: string): string {
  return s.replace(ESCAPE_REGEX, "\\$&");
}

export function normaliseSpecifier(
  spec: string,
  resolvedTarget: string
): string {
  if (resolvedTarget.endsWith(".vue")) {
    return spec.endsWith(".vue") ? spec : `${spec}.vue`;
  }
  return spec.replace(EXT_REGEX, "");
}

function computeWebSpecifier(
  normFile: string,
  normTarget: string
): string | null {
  if (!normFile.startsWith("apps/web/")) {
    return null;
  }
  const underTarget = normTarget.slice("apps/web/".length);
  if (underTarget.startsWith("server/")) {
    const sub = underTarget.slice("server/".length);
    return normaliseSpecifier(`#server/${sub}`, normTarget);
  }
  if (underTarget.startsWith("app/")) {
    const sub = underTarget.slice("app/".length);
    return normaliseSpecifier(`~/${sub}`, normTarget);
  }
  if (underTarget.startsWith("shared/")) {
    const sub = underTarget.slice("shared/".length);
    return normaliseSpecifier(`#shared/${sub}`, normTarget);
  }
  return normaliseSpecifier(`~~/${underTarget}`, normTarget);
}

function computeAdminSpecifier(
  normFile: string,
  normTarget: string
): string | null {
  if (!normFile.startsWith("apps/admin/")) {
    return null;
  }
  const underTarget = normTarget.slice("apps/admin/".length);
  if (underTarget.startsWith("app/")) {
    const sub = underTarget.slice("app/".length);
    return normaliseSpecifier(`~/${sub}`, normTarget);
  }
  return normaliseSpecifier(`~~/${underTarget}`, normTarget);
}

function computePkgSpecifier(
  normFile: string,
  normTarget: string
): string | null {
  const targetPkgMatch = normTarget.match(TARGET_PKG_REGEX);
  if (!targetPkgMatch) {
    return null;
  }
  const targetPkg = targetPkgMatch[1];
  const underTarget = targetPkgMatch[2];

  const filePkgMatch = normFile.match(FILE_PKG_REGEX);
  if (!filePkgMatch || filePkgMatch[1] !== targetPkg) {
    return null;
  }

  if (underTarget.startsWith("src/")) {
    const sub = underTarget.slice("src/".length);
    return normaliseSpecifier(`#src/${sub}`, normTarget);
  }
  if (underTarget.startsWith("tests/")) {
    const sub = underTarget.slice("tests/".length);
    return normaliseSpecifier(`#tests/${sub}`, normTarget);
  }
  if (underTarget.startsWith("scripts/")) {
    const sub = underTarget.slice("scripts/".length);
    return normaliseSpecifier(`#scripts/${sub}`, normTarget);
  }
  return null;
}

export function computeAliasedSpecifier(
  relFile: string,
  _fromSpec: string,
  resolvedTarget: string
): string | null {
  const normFile = relFile.split(path.sep).join("/");
  const normTarget = resolvedTarget.split(path.sep).join("/");

  if (normTarget.startsWith("apps/web/")) {
    return computeWebSpecifier(normFile, normTarget);
  }
  if (normTarget.startsWith("apps/admin/")) {
    return computeAdminSpecifier(normFile, normTarget);
  }
  if (normTarget.startsWith("packages/")) {
    return computePkgSpecifier(normFile, normTarget);
  }
  return null;
}

export function rewriteFileImports(
  filePath: string,
  dryRun = true,
  root: string = REPO_ROOT
): RewriteResult {
  const relFile = path.relative(root, filePath).split(path.sep).join("/");
  if (isExemptGeneratorSource(relFile, 0)) {
    return { file: relFile, changed: false, rewrites: [] };
  }

  let content = fs.readFileSync(filePath, "utf8");
  const specs = extractModuleSpecifiers(content);
  const rewrites: Array<{ line: number; from: string; to: string }> = [];

  for (const { spec, line } of specs) {
    const isParentRelative = spec.startsWith("../");
    const isAdminAt =
      relFile.startsWith("apps/admin/") && spec.startsWith("@/");

    if (!(isParentRelative || isAdminAt)) {
      continue;
    }

    const resolved = resolveTarget(relFile, spec, root);
    if (!resolved) {
      continue;
    }

    const aliased = computeAliasedSpecifier(relFile, spec, resolved);
    if (!aliased || aliased === spec) {
      continue;
    }

    rewrites.push({ line, from: spec, to: aliased });
  }

  if (rewrites.length === 0) {
    return { file: relFile, changed: false, rewrites: [] };
  }

  for (const rw of rewrites) {
    const regex = new RegExp(`(["'])${escapeRegExp(rw.from)}\\1`, "g");
    content = content.replace(regex, `$1${rw.to}$1`);
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, content, "utf8");
  }

  return { file: relFile, changed: true, rewrites };
}

function findFileCrossLeaks(
  file: string,
  root: string
): CrossWorkspaceFinding[] {
  const relFile = path.relative(root, file).split(path.sep).join("/");
  if (isExemptGeneratorSource(relFile, 0)) {
    return [];
  }
  const raw = fs.readFileSync(file, "utf8");
  const specs = extractModuleSpecifiers(raw);
  const leaks: CrossWorkspaceFinding[] = [];

  for (const { spec, line } of specs) {
    if (!spec.startsWith("../")) {
      continue;
    }
    const resolved = resolveTarget(relFile, spec, root);
    if (!resolved) {
      continue;
    }
    const aliased = computeAliasedSpecifier(relFile, spec, resolved);
    if (!aliased) {
      leaks.push({
        file: relFile,
        line,
        fromSpec: spec,
        target: resolved,
      });
    }
  }

  return leaks;
}

export function runCodemod(
  scope?: string,
  dryRun = true,
  root: string = REPO_ROOT
): {
  readonly touchedFiles: number;
  readonly totalRewrites: number;
  readonly crossLeaks: CrossWorkspaceFinding[];
} {
  const scanDirs = ["apps", "packages", "infra"].map((d) => repoPath(d));
  let touchedFiles = 0;
  let totalRewrites = 0;
  const crossLeaks: CrossWorkspaceFinding[] = [];

  for (const scanDir of scanDirs) {
    for (const file of walkSource(scanDir)) {
      const relFile = path.relative(root, file).split(path.sep).join("/");
      if (scope && !relFile.startsWith(scope)) {
        continue;
      }
      if (isFixturePath(file, scanDir)) {
        continue;
      }

      crossLeaks.push(...findFileCrossLeaks(file, root));

      const res = rewriteFileImports(file, dryRun, root);
      if (res.changed) {
        touchedFiles++;
        totalRewrites += res.rewrites.length;
      }
    }
  }

  return { touchedFiles, totalRewrites, crossLeaks };
}

function printCrossLeaks(leaks: readonly CrossWorkspaceFinding[]): void {
  if (leaks.length === 0) {
    return;
  }
  console.log(
    `\nFound ${leaks.length} cross-workspace relative leaks (not auto-rewritten):`
  );
  for (const leak of leaks) {
    console.log(
      `  ${leak.file}:${leak.line} "${leak.fromSpec}" -> ${leak.target}`
    );
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const isWrite = args.includes("--write");
  const dryRun = !isWrite;

  let scope: string | undefined;
  for (const arg of args) {
    if (arg.startsWith("--scope=")) {
      scope = arg.slice("--scope=".length);
    }
  }

  console.log(
    `Running import path rewrite codemod (dryRun=${dryRun}, scope=${scope || "all"})...`
  );
  const result = runCodemod(scope, dryRun);
  console.log(
    `Processed: ${result.touchedFiles} files modified, ${result.totalRewrites} imports rewritten.`
  );

  printCrossLeaks(result.crossLeaks);

  if (isWrite) {
    const findings = findImportPathViolations();
    writeImportPathDebt(findings.map((f) => f.key));
    console.log(
      `Updated import-path-debt.json: now ${findings.length} remaining debt entries.`
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
