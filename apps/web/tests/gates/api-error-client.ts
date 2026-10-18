import fs from "node:fs";
import path from "node:path";

const RAW_FETCH_CALL_PATTERN =
  /(?:\bglobalThis\.\$fetch\b|\$fetch\s*(?:<[^>]*>)?\s*\()/;

const ALLOWED_FETCH_FILE_SUFFIXES: readonly string[] = [
  "apps/web/app/composables/use-api.ts",
  "apps/web/app/plugins/api.ts",
  "apps/admin/app/composables/use-api-client.ts",
];

function normalizeFilePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function isAllowedFetchFile(filePath: string): boolean {
  const normalized = normalizeFilePath(filePath);
  return ALLOWED_FETCH_FILE_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`/${suffix}`)
  );
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

export function scanFilesForRawFetchCalls(
  files: ReadonlyArray<{ filePath: string; content: string }>
): void {
  for (const file of files) {
    if (isAllowedFetchFile(file.filePath)) {
      continue;
    }
    const codeOnly = stripComments(file.content);
    if (RAW_FETCH_CALL_PATTERN.test(codeOnly)) {
      throw new Error(
        `BR-AEC-02 VIOLATION: File '${file.filePath}' calls raw $fetch directly. Use useApi() in apps/web or useApiClient() in apps/admin instead.`
      );
    }
  }
}

function readAppFilesRecursive(
  dir: string
): Array<{ filePath: string; content: string }> {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const results: Array<{ filePath: string; content: string }> = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readAppFilesRecursive(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".vue") || entry.name.endsWith(".ts"))
    ) {
      results.push({
        filePath: fullPath,
        content: fs.readFileSync(fullPath, "utf-8"),
      });
    }
  }
  return results;
}

export function scanAppDirectoriesForRawFetchCalls(
  appDirs: readonly string[]
): void {
  const allFiles: Array<{ filePath: string; content: string }> = [];
  for (const dir of appDirs) {
    allFiles.push(...readAppFilesRecursive(dir));
  }
  scanFilesForRawFetchCalls(allFiles);
}
