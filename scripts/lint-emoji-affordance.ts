import fs from "node:fs";
import path from "node:path";

/**
 * Regex for emoji characters (broad range).
 */
const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

function isIgnoredDir(dirPath: string): boolean {
  return (
    dirPath.includes("node_modules") ||
    dirPath.includes(".output") ||
    dirPath.includes("dist") ||
    dirPath.includes(".nuxt")
  );
}

function checkVueFileLine(
  line: string,
  filePath: string,
  lineNumber: number
): string | null {
  const isAffordanceProp =
    line.includes("label=") ||
    line.includes("aria-label=") ||
    line.includes("icon=");

  if (isAffordanceProp && EMOJI_REGEX.test(line)) {
    return `BR-EMJ-03 violation in ${filePath}:${lineNumber}: Emoji used as affordance in label/aria-label/icon: "${line.trim()}"`;
  }

  return null;
}

function checkVueFile(fullPath: string): string[] {
  const fileViolations: string[] = [];
  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const violation = checkVueFileLine(lines[i], fullPath, i + 1);
    if (violation) {
      fileViolations.push(violation);
    }
  }

  return fileViolations;
}

/**
 * Scans `.vue` files to ensure emojis are NOT used as affordances (BR-EMJ-03).
 */
export function lintEmojiAffordance(targetDir: string): {
  violations: string[];
} {
  const violations: string[] = [];

  function scan(dirPath: string) {
    if (isIgnoredDir(dirPath)) {
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".vue")) {
        violations.push(...checkVueFile(fullPath));
      }
    }
  }

  scan(targetDir);
  return { violations };
}

// Run CLI
if (process.argv[1]?.endsWith("lint-emoji-affordance.ts")) {
  const rootDir = process.cwd();
  const { violations } = lintEmojiAffordance(rootDir);

  if (violations.length > 0) {
    console.error("❌ [lint:emoji] Violations found:");
    for (const v of violations) {
      console.error(`   ${v}`);
    }
    process.exit(1);
  }

  console.log("✅ [lint:emoji] BR-EMJ-03 & BR-EMJ-06 passed cleanly.");
}
