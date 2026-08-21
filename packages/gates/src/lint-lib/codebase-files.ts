import fs from "node:fs";
import path from "node:path";
import { isFixturePath } from "./source-scan.ts";

/** Một file nguồn đã đọc, đường dẫn tương đối gốc quét. */
export interface FileItem {
  readonly filePath: string;
  readonly content: string;
}

const SOURCE_EXTENSIONS = [".ts", ".js", ".vue"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".output"]);
const SCAN_ROOTS = ["apps", "packages"];

function isScannableDir(entry: fs.Dirent): boolean {
  return (
    entry.isDirectory() &&
    !entry.name.startsWith(".") &&
    !SKIP_DIRS.has(entry.name)
  );
}

function isSourceFile(entry: fs.Dirent): boolean {
  return (
    entry.isFile() && SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
  );
}

function walk(dir: string, rootDir: string, results: FileItem[]): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (isFixturePath(fullPath, rootDir)) {
      continue;
    }
    if (isScannableDir(entry)) {
      walk(fullPath, rootDir, results);
      continue;
    }
    if (isSourceFile(entry)) {
      results.push({
        filePath: path.relative(rootDir, fullPath),
        content: fs.readFileSync(fullPath, "utf-8"),
      });
    }
  }
}

/**
 * Đọc toàn bộ nguồn dưới `apps/` + `packages/` của một gốc.
 *
 * `lint-gating` và `lint-kid-surface` từng có **hai bản sao y nhau** của hàm này;
 * sửa quy tắc bỏ qua ở một chỗ mà quên chỗ kia là cách một cổng lặng lẽ quét
 * khác cổng còn lại.
 */
export function readCodebaseFiles(rootDir: string): FileItem[] {
  const results: FileItem[] = [];

  for (const scanRoot of SCAN_ROOTS) {
    walk(path.join(rootDir, scanRoot), rootDir, results);
  }

  return results;
}
