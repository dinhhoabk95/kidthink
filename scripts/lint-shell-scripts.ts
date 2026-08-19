#!/usr/bin/env node
/**
 * Gate: lint:shell
 * Owns: static analysis of every shell script that runs on the server.
 *
 * `bash -n` alone is not this gate. It accepts unquoted expansions, masked
 * return values and unset-variable reads — the exact defects that turn a
 * deploy script into a half-applied release. shellcheck is therefore required,
 * and its absence is a failure rather than a silent pass.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export interface ShellLintError {
  file: string;
  line: number;
  code: string;
  message: string;
}

const SCAN_DIRS = ["infra/scripts", "scripts"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".output"]);
const INSTALL_HINT =
  "Install it: `brew install shellcheck` (macOS) or `apt-get install shellcheck` (Debian/Ubuntu).";

export function isShellcheckAvailable(): boolean {
  return (
    spawnSync("shellcheck", ["--version"], { encoding: "utf8" }).status === 0
  );
}

export function checkBashSyntax(filePath: string): ShellLintError | null {
  const result = spawnSync("bash", ["-n", filePath], { encoding: "utf8" });
  if (result.status === 0) {
    return null;
  }
  return {
    file: filePath,
    line: 0,
    code: "bash-n",
    message: (result.stderr || result.stdout || "Syntax error").trim(),
  };
}

interface ShellcheckComment {
  file: string;
  line: number;
  level: string;
  code: number;
  message: string;
}

function isShellcheckCommentArray(val: unknown): val is ShellcheckComment[] {
  if (!Array.isArray(val)) {
    return false;
  }
  return val.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      "file" in c &&
      typeof c.file === "string" &&
      "line" in c &&
      typeof c.line === "number" &&
      "level" in c &&
      typeof c.level === "string" &&
      "code" in c &&
      typeof c.code === "number" &&
      "message" in c &&
      typeof c.message === "string"
  );
}

export function runShellcheck(files: string[], root: string): ShellLintError[] {
  if (files.length === 0) {
    return [];
  }

  // -x follows `source` into lib/, which is where most of the logic lives.
  const result = spawnSync(
    "shellcheck",
    ["--shell=bash", "--severity=warning", "--format=json", "-x", ...files],
    { encoding: "utf8", cwd: root, maxBuffer: 20 * 1024 * 1024 }
  );

  const raw = (result.stdout || "").trim();
  if (raw.length === 0) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [
      {
        file: "(shellcheck)",
        line: 0,
        code: "parse",
        message: `Unreadable shellcheck output: ${raw.slice(0, 200)}`,
      },
    ];
  }

  if (!isShellcheckCommentArray(parsed)) {
    return [
      {
        file: "(shellcheck)",
        line: 0,
        code: "parse",
        message: `Unreadable shellcheck output: ${raw.slice(0, 200)}`,
      },
    ];
  }

  return parsed.map((c) => ({
    file: relative(root, resolve(root, c.file)),
    line: c.line,
    code: `SC${c.code}`,
    message: `${c.level}: ${c.message}`,
  }));
}

export function collectShellScripts(root = process.cwd()): string[] {
  const found: string[] = [];

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(entry)) {
          walk(full);
        }
        continue;
      }
      if (entry.endsWith(".sh")) {
        found.push(full);
      }
    }
  }

  for (const dir of SCAN_DIRS) {
    walk(resolve(root, dir));
  }
  return found.sort();
}

export function scanAndLintShellScripts(
  root = process.cwd()
): ShellLintError[] {
  const files = collectShellScripts(root);
  const errors: ShellLintError[] = [];

  for (const file of files) {
    const syntaxError = checkBashSyntax(file);
    if (syntaxError) {
      errors.push({ ...syntaxError, file: relative(root, file) });
    }
  }

  // A file that does not parse would only produce noise in shellcheck too.
  if (errors.length > 0) {
    return errors;
  }

  return runShellcheck(
    files.map((f) => relative(root, f)),
    root
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!isShellcheckAvailable()) {
    console.error(
      `❌ [lint:shell] shellcheck is not installed. ${INSTALL_HINT}`
    );
    process.exit(1);
  }

  const files = collectShellScripts();
  if (files.length === 0) {
    console.error(
      `❌ [lint:shell] Found 0 shell scripts under ${SCAN_DIRS.join(", ")}; the gate would pass without checking anything.`
    );
    process.exit(1);
  }

  const errors = scanAndLintShellScripts();
  if (errors.length === 0) {
    console.log(
      `✅ [lint:shell] ${files.length} shell scripts pass shellcheck.`
    );
    process.exit(0);
  }

  console.error(`❌ [lint:shell] ${errors.length} findings:`);
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line} ${e.code} ${e.message}`);
  }
  process.exit(1);
}
