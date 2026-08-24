import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, repoPath } from "@mindkid/config/paths";
import { walkSource } from "./lint-lib/source-scan.ts";

export interface ImportLocation {
  readonly spec: string;
  readonly line: number;
  readonly raw: string;
}

export interface ImportGraphEntry {
  readonly location: string;
  readonly specifier: string;
  readonly resolvedTarget: string;
}

const DEFAULT_SCAN_ROOTS = ["apps", "packages", "infra"].map((d) =>
  repoPath(d)
);

const EXEMPT_GENERATOR_FILES = new Set([
  "packages/game-engine/scripts/create-template.ts",
  "packages/game-engine/scripts/gen-templates-lib.ts",
]);

const APPS_PATH_REGEX = /^apps\/([^/]+)/;
const PKG_PATH_REGEX = /^packages\/([^/]+)/;

const STATIC_IMPORT_REGEX =
  /(?:^|\n)\s*(?:import\s+(?:type\s+)?(?:[\s\S]*?from\s+)?|export\s+(?:type\s+)?(?:[\s\S]*?from\s+)?)["\x27]([^"\x27\r\n]+)["\x27]/g;
const DYNAMIC_IMPORT_REGEX =
  /\b(?:import|vi\.mock)\s*\(\s*["\x27]([^"\x27\r\n]+)["\x27]\s*\)/g;
const MULTILINE_DYNAMIC_REGEX =
  /\b(?:import|vi\.mock)\s*\(\s*[\r\n\s]+["\x27]([^"\x27\r\n]+)["\x27]\s*[\r\n\s]*\)/g;

const BLOCK_COMMENT_REGEX = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_REGEX = /(^|[^:\\])\/\/[^\n]*/g;
const JS_EXT_REGEX = /\.js$/;

export function isExemptGeneratorSource(
  relFile: string,
  _line: number
): boolean {
  return EXEMPT_GENERATOR_FILES.has(relFile.split(path.sep).join("/"));
}

function stripComments(source: string): string {
  return source
    .replace(BLOCK_COMMENT_REGEX, (m) => "\n".repeat(m.split("\n").length - 1))
    .replace(LINE_COMMENT_REGEX, "$1");
}

export function extractModuleSpecifiers(source: string): ImportLocation[] {
  const uncommented = stripComments(source);
  const results: ImportLocation[] = [];

  // 1. Static import/export
  for (const m of uncommented.matchAll(STATIC_IMPORT_REGEX)) {
    const spec = m[1];
    const matchIndex = (m.index ?? 0) + m[0].lastIndexOf(spec);
    const line = uncommented.slice(0, matchIndex).split("\n").length;
    results.push({ spec, line, raw: m[0].trim() });
  }

  // 2. Dynamic import / vi.mock
  for (const m of uncommented.matchAll(DYNAMIC_IMPORT_REGEX)) {
    const spec = m[1];
    const matchIndex = (m.index ?? 0) + m[0].lastIndexOf(spec);
    const line = uncommented.slice(0, matchIndex).split("\n").length;
    if (!results.some((r) => r.line === line && r.spec === spec)) {
      results.push({ spec, line, raw: m[0].trim() });
    }
  }

  // 3. Multiline dynamic import
  for (const m of uncommented.matchAll(MULTILINE_DYNAMIC_REGEX)) {
    const spec = m[1];
    const matchIndex = (m.index ?? 0) + m[0].lastIndexOf(spec);
    const line = uncommented.slice(0, matchIndex).split("\n").length;
    if (!results.some((r) => r.line === line && r.spec === spec)) {
      results.push({ spec, line, raw: m[0].trim() });
    }
  }

  return results.sort((a, b) => a.line - b.line);
}

export function isMonorepoSpecifier(spec: string): boolean {
  return (
    spec.startsWith("./") ||
    spec.startsWith("../") ||
    spec.startsWith("~/") ||
    spec.startsWith("@/") ||
    spec.startsWith("~~/") ||
    spec.startsWith("@@/") ||
    spec.startsWith("#server/") ||
    spec.startsWith("#shared/") ||
    spec.startsWith("#src/") ||
    spec.startsWith("#tests/") ||
    spec.startsWith("#scripts/") ||
    spec.startsWith("@mindkid/")
  );
}

function resolveAppBase(
  root: string,
  relFilePath: string,
  spec: string
): string | null {
  const match = relFilePath.match(APPS_PATH_REGEX);
  if (!match) {
    return null;
  }
  const app = match[1];
  if (spec.startsWith("~/") || spec.startsWith("@/")) {
    return path.resolve(root, "apps", app, "app", spec.slice(2));
  }
  if (spec.startsWith("~~/") || spec.startsWith("@@/")) {
    return path.resolve(root, "apps", app, spec.slice(3));
  }
  if (spec.startsWith("#server/")) {
    return path.resolve(root, "apps", app, "server", spec.slice(8));
  }
  if (spec.startsWith("#shared/")) {
    return path.resolve(root, "apps", app, "shared", spec.slice(8));
  }
  return null;
}

function resolvePkgSubpathBase(
  root: string,
  relFilePath: string,
  spec: string
): string | null {
  const match = relFilePath.match(PKG_PATH_REGEX);
  if (!match) {
    return null;
  }
  const pkg = match[1];
  if (spec.startsWith("#src/")) {
    return path.resolve(root, "packages", pkg, "src", spec.slice(5));
  }
  if (spec.startsWith("#tests/")) {
    return path.resolve(root, "packages", pkg, "tests", spec.slice(7));
  }
  if (spec.startsWith("#scripts/")) {
    return path.resolve(root, "packages", pkg, "scripts", spec.slice(9));
  }
  return null;
}

function resolveWorkspacePkgBase(root: string, spec: string): string | null {
  const sub = spec.slice("@mindkid/".length);
  const parts = sub.split("/");
  const pkgName = parts[0];
  const subPath = parts.slice(1).join("/");
  const pkgDir = path.resolve(root, "packages", pkgName);
  const pkgJsonPath = path.join(pkgDir, "package.json");

  if (!fs.existsSync(pkgJsonPath)) {
    return null;
  }

  const parsed: unknown = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const pkgJson = typeof parsed === "object" && parsed !== null ? parsed : {};
  const mainVal = Reflect.get(pkgJson, "main");
  const main = typeof mainVal === "string" ? mainVal : "src/index.ts";

  if (!subPath) {
    return path.resolve(pkgDir, main);
  }

  const exportsVal = Reflect.get(pkgJson, "exports");
  const exportsObj =
    typeof exportsVal === "object" && exportsVal !== null ? exportsVal : null;
  const exportKey = `./${subPath}`;
  const expVal = exportsObj ? Reflect.get(exportsObj, exportKey) : null;
  const exp = typeof expVal === "string" ? expVal : null;

  return exp ? path.resolve(pkgDir, exp) : path.resolve(pkgDir, "src", subPath);
}

export function resolveTarget(
  relFilePath: string,
  spec: string,
  root: string = REPO_ROOT
): string | null {
  let targetBase: string | null = null;
  const absFile = path.resolve(root, relFilePath);
  const fileDir = path.dirname(absFile);
  const normalizedRel = relFilePath.split(path.sep).join("/");

  if (spec.startsWith("./") || spec.startsWith("../")) {
    targetBase = path.resolve(fileDir, spec);
  } else if (
    spec.startsWith("~/") ||
    spec.startsWith("@/") ||
    spec.startsWith("~~/") ||
    spec.startsWith("@@/") ||
    spec.startsWith("#server/") ||
    spec.startsWith("#shared/")
  ) {
    targetBase = resolveAppBase(root, normalizedRel, spec);
  } else if (
    spec.startsWith("#src/") ||
    spec.startsWith("#tests/") ||
    spec.startsWith("#scripts/")
  ) {
    targetBase = resolvePkgSubpathBase(root, normalizedRel, spec);
  } else if (spec.startsWith("@mindkid/")) {
    targetBase = resolveWorkspacePkgBase(root, spec);
  }

  if (!targetBase) {
    return null;
  }

  const candidates = [
    targetBase,
    targetBase.replace(JS_EXT_REGEX, ".ts"),
    targetBase.replace(JS_EXT_REGEX, ".vue"),
    `${targetBase}.ts`,
    `${targetBase}.vue`,
    `${targetBase}.js`,
    `${targetBase}.json`,
    path.join(targetBase, "index.ts"),
    path.join(targetBase, "index.vue"),
    path.join(targetBase, "index.js"),
    path.join(targetBase, "index.json"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && !fs.statSync(c).isDirectory()) {
      return path.relative(root, c).split(path.sep).join("/");
    }
  }

  return null;
}

function scanFileImportEntries(file: string, root: string): [string, string][] {
  const relFile = path.relative(root, file).split(path.sep).join("/");
  if (isExemptGeneratorSource(relFile, 0)) {
    return [];
  }
  const raw = fs.readFileSync(file, "utf8");
  const specs = extractModuleSpecifiers(raw);
  const entries: [string, string][] = [];

  for (const { spec, line } of specs) {
    if (!isMonorepoSpecifier(spec)) {
      continue;
    }
    const resolved = resolveTarget(relFile, spec, root);
    if (resolved) {
      entries.push([`${relFile}:${line}`, resolved]);
    }
  }
  return entries;
}

export function buildImportGraph(
  roots: readonly string[] = DEFAULT_SCAN_ROOTS,
  root: string = REPO_ROOT
): Map<string, string> {
  const graph = new Map<string, string>();

  for (const scanDir of roots) {
    for (const file of walkSource(scanDir)) {
      for (const [loc, target] of scanFileImportEntries(file, root)) {
        graph.set(loc, target);
      }
    }
  }

  const sorted = new Map<string, string>();
  for (const key of [...graph.keys()].sort()) {
    const val = graph.get(key);
    if (val) {
      sorted.set(key, val);
    }
  }
  return sorted;
}
