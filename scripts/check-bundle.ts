import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const MAX_TEMPLATE_CHUNK_GZIP_BYTES = 80 * 1024; // 80 KB (BR-ENG-17)

interface ChunkReport {
  readonly filename: string;
  readonly rawBytes: number;
  readonly gzipBytes: number;
  readonly passed: boolean;
}

function findJsFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

function main(): void {
  const repoRoot = join(import.meta.dirname, "..");
  const webDir = join(repoRoot, "apps/web");
  const nuxtOutputDir = join(webDir, ".output");

  console.log("Checking bundle size for @mindkid/web...");

  // If .output does not exist or user requests rebuild, trigger nuxt build
  if (!existsSync(nuxtOutputDir)) {
    console.log(
      "No .output found. Running 'pnpm --filter @mindkid/web build'..."
    );
    execSync("pnpm --filter @mindkid/web build", {
      cwd: repoRoot,
      stdio: "inherit",
    });
  }

  const publicNuxtDir = join(nuxtOutputDir, "public/_nuxt");
  const jsFiles = findJsFiles(publicNuxtDir);

  if (jsFiles.length === 0) {
    console.warn(`Warning: No client chunks found in ${publicNuxtDir}`);
    return;
  }

  const reports: ChunkReport[] = [];
  let hasViolation = false;

  for (const file of jsFiles) {
    const content = readFileSync(file);
    const rawBytes = content.length;
    const gzipBytes = gzipSync(content).length;
    const filename = file.slice(publicNuxtDir.length + 1);

    // Filter chunks for game templates or large client assets
    const isTemplateChunk =
      filename.toLowerCase().includes("gt-") ||
      filename.toLowerCase().includes("template");
    const passed =
      !isTemplateChunk || gzipBytes <= MAX_TEMPLATE_CHUNK_GZIP_BYTES;

    if (!passed) {
      hasViolation = true;
    }

    reports.push({
      filename,
      rawBytes,
      gzipBytes,
      passed,
    });
  }

  console.log("\n--- Client Bundle Chunk Report ---");
  for (const r of reports) {
    const kb = (r.gzipBytes / 1024).toFixed(2);
    const status = r.passed ? "OK" : "EXCEEDED";
    console.log(
      `[${status}] ${r.filename}: ${kb} KB (raw: ${(r.rawBytes / 1024).toFixed(2)} KB)`
    );
  }

  if (hasViolation) {
    console.error(
      `\nError: One or more template chunks exceeded ${MAX_TEMPLATE_CHUNK_GZIP_BYTES / 1024} KB gzip budget (BR-ENG-17)`
    );
    process.exit(1);
  }

  console.log("\nAll checked chunks are within budget.");
}

main();
