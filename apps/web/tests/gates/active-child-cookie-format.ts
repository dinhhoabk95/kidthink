import fs from "node:fs";
import path from "node:path";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const COOKIE_ASSIGNMENT_PATTERN =
  /(useCookie\s*\(\s*["']active_child_id["']\s*\)\.value\s*=|useCookie<[^>]+>\s*\(\s*["']active_child_id["']\s*\)\.value\s*=|document\.cookie\s*=.*active_child_id)/;

export function validateActiveChildCookieValue(
  val: string | null | undefined
): boolean {
  if (!val || typeof val !== "string") {
    return false;
  }
  return UUID_REGEX.test(val.trim());
}

export function scanActiveChildCookieAssignments(
  files: Array<{ filePath: string; content: string }>
): void {
  for (const file of files) {
    if (COOKIE_ASSIGNMENT_PATTERN.test(file.content)) {
      throw new Error(
        `BR-PEN-01 VIOLATION: Client component '${file.filePath}' directly writes active_child_id cookie. Active child cookie must only be set by POST /api/users/children/{uuid}/activate.`
      );
    }
  }
}

export function scanAppDirectoryForActiveChildCookieMutations(
  appDir: string
): void {
  if (!fs.existsSync(appDir)) {
    return;
  }

  function readFilesRecursive(
    dir: string
  ): Array<{ filePath: string; content: string }> {
    const results: Array<{ filePath: string; content: string }> = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...readFilesRecursive(fullPath));
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

  const allFiles = readFilesRecursive(appDir);
  scanActiveChildCookieAssignments(allFiles);
}
