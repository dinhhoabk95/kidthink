import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * Gate: lint:shell-scripts (WP90.10)
 * Validates bash syntax on all shell scripts using bash -n syntax verification.
 */

export interface ShellLintError {
  file: string;
  error: string;
}

export function checkBashSyntax(filePath: string): ShellLintError | null {
  const result = spawnSync("bash", ["-n", filePath], { encoding: "utf8" });
  if (result.status !== 0) {
    return {
      file: filePath,
      error: (result.stderr || result.stdout || "Syntax error").trim(),
    };
  }
  return null;
}

function processShellEntry(
  entry: import("node:fs").Dirent,
  dir: string,
  root: string,
  errors: ShellLintError[],
  walk: (d: string) => void
) {
  const fullPath = join(dir, entry.name);
  if (entry.isDirectory()) {
    if (entry.name !== "node_modules" && entry.name !== "dist") {
      walk(fullPath);
    }
    return;
  }
  if (entry.isFile() && entry.name.endsWith(".sh")) {
    const err = checkBashSyntax(fullPath);
    if (err) {
      errors.push({
        file: relative(root, fullPath),
        error: err.error,
      });
    }
  }
}

export function scanAndLintShellScripts(
  root = process.cwd()
): ShellLintError[] {
  const errors: ShellLintError[] = [];
  const searchDirs = [resolve(root, "infra/scripts"), resolve(root, "scripts")];

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        processShellEntry(entry, dir, root, errors, walk);
      }
    } catch {
      // Directory may not exist
    }
  }

  for (const sDir of searchDirs) {
    walk(sDir);
  }

  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = scanAndLintShellScripts();
  if (errors.length === 0) {
    console.log(
      "✅ [lint:shell-scripts] All bash scripts passed syntax verification."
    );
    process.exit(0);
  } else {
    console.error(
      `❌ [lint:shell-scripts] Found ${errors.length} shell syntax errors:`
    );
    for (const e of errors) {
      console.error(`  ${e.file}: ${e.error}`);
    }
    process.exit(1);
  }
}
