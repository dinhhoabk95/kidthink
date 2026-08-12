import fs from "node:fs";
import path from "node:path";

export interface FileItem {
  filePath: string;
  content: string;
}

const RE_ALLOWED_TIERS = /allowedTiers\s*\(/;
const RE_CLIENT_TIER_CHECK = /access_tier\s*===?\s*['"](standard|premium)['"]/;

function checkServerGating(file: FileItem): string | null {
  const returnsContentPack = file.content.includes("content_pack");
  const returnsDiffParams = file.content.includes("difficulty_params");
  const hasGatingCall =
    file.content.includes("assertContentAccess") ||
    file.content.includes("assertContentAccess(");

  if ((returnsContentPack || returnsDiffParams) && !hasGatingCall) {
    return `BR-GAT-01 VIOLATION: Handler "${file.filePath}" returns content_pack/difficulty_params without calling assertContentAccess()`;
  }
  return null;
}

function checkClientGating(file: FileItem): string | null {
  const hasClientTierCheck =
    RE_ALLOWED_TIERS.test(file.content) ||
    RE_CLIENT_TIER_CHECK.test(file.content);

  if (hasClientTierCheck) {
    return `BR-GAT-01 VIOLATION: Client file "${file.filePath}" attempts access tier gating logic on client-side.`;
  }
  return null;
}

/**
 * BR-GAT-01 & D-FO: Content handlers must call assertContentAccess on server side.
 * Client components must NOT execute access tier gating checks.
 */
export function scanGatingHandlers(files: FileItem[]): void {
  const violations: string[] = [];

  for (const file of files) {
    const isServer =
      file.filePath.includes("server/api/") ||
      file.filePath.includes("server/routes/");
    const isClient =
      file.filePath.includes("apps/web/components/") ||
      file.filePath.includes("apps/web/pages/") ||
      file.filePath.includes("apps/web/composables/");

    if (isServer) {
      const err = checkServerGating(file);
      if (err) {
        violations.push(err);
      }
    }

    if (isClient) {
      const err = checkClientGating(file);
      if (err) {
        violations.push(err);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }
}

export function readCodebaseFiles(rootDir: string): FileItem[] {
  const results: FileItem[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) {
      return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== ".output"
      ) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") ||
          entry.name.endsWith(".js") ||
          entry.name.endsWith(".vue"))
      ) {
        const relPath = path.relative(rootDir, fullPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        results.push({ filePath: relPath, content });
      }
    }
  }

  walk(path.join(rootDir, "apps"));
  walk(path.join(rootDir, "packages"));
  return results;
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const files = readCodebaseFiles(process.cwd());
    scanGatingHandlers(files);
    console.log(
      "✅ [lint:gating] BR-GAT-01 & D-FO gating checks passed cleanly."
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ [lint:gating] Failure:\n${message}`);
    process.exit(1);
  }
}
