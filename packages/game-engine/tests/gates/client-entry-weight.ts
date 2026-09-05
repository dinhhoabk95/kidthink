import fs from "node:fs";
import path from "node:path";

export interface StaticImportViolation {
  readonly file: string;
  readonly importedSpecifier: string;
}

const STATIC_IMPORT_REGEX =
  /(?:^|\n)\s*(?:import|export)\s+(?:(?:(?:\*\s+as\s+\w+|[\w$,\s{}]+)\s+from\s+)|)['"]([^'"]+)['"]/g;

const FORBIDDEN_IMPORT_PATTERN =
  /(?:templates\/GT-[^/]+\/(?:session|fixtures)|#src\/templates\/GT-[^/]+\/(?:session|fixtures))/;

const JS_EXT_REGEX = /\.js$/;

export function findDirectForbiddenStaticImports(
  filePath: string,
  content: string
): StaticImportViolation[] {
  const violations: StaticImportViolation[] = [];
  STATIC_IMPORT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while (true) {
    match = STATIC_IMPORT_REGEX.exec(content);
    if (!match) {
      break;
    }
    const specifier = match[1];
    if (specifier && FORBIDDEN_IMPORT_PATTERN.test(specifier)) {
      violations.push({
        file: filePath,
        importedSpecifier: specifier,
      });
    }
  }

  return violations;
}

function resolveCandidateFilePath(targetPath: string): string | null {
  const candidatePaths = [
    targetPath,
    targetPath.replace(JS_EXT_REGEX, ".ts"),
    `${targetPath}.ts`,
    `${targetPath}.js`,
    path.join(targetPath, "index.ts"),
    path.join(targetPath, "index.js"),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }
  return null;
}

function resolveTargetPath(
  resolvedEntry: string,
  specifier: string
): string | null {
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(resolvedEntry), specifier);
  }
  if (specifier.startsWith("#src/")) {
    const srcIndex = resolvedEntry.indexOf("/src/");
    const srcDir = path.resolve(
      path.dirname(resolvedEntry),
      srcIndex >= 0 ? resolvedEntry.slice(0, srcIndex + 5) : "./src"
    );
    return path.resolve(srcDir, specifier.slice(5));
  }
  return null;
}

export function traceClientEntryStaticImports(
  entryFilePath: string,
  visited = new Set<string>()
): StaticImportViolation[] {
  const resolvedEntry = path.resolve(entryFilePath);
  if (visited.has(resolvedEntry) || !fs.existsSync(resolvedEntry)) {
    return [];
  }
  visited.add(resolvedEntry);

  const content = fs.readFileSync(resolvedEntry, "utf8");
  const allViolations = [
    ...findDirectForbiddenStaticImports(resolvedEntry, content),
  ];

  STATIC_IMPORT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null = null;
  while (true) {
    match = STATIC_IMPORT_REGEX.exec(content);
    if (!match) {
      break;
    }
    const specifier = match[1];
    if (!specifier) {
      continue;
    }

    const targetPath = resolveTargetPath(resolvedEntry, specifier);
    if (targetPath) {
      const resolvedFile = resolveCandidateFilePath(targetPath);
      if (resolvedFile) {
        allViolations.push(
          ...traceClientEntryStaticImports(resolvedFile, visited)
        );
      }
    }
  }

  return allViolations;
}
