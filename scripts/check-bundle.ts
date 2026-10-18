import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { REPO_ROOT } from "@mindkid/config/paths";

export const MAX_TEMPLATE_CHUNK_GZIP_BYTES = 80 * 1024; // 80 KB (BR-ENG-17, BR-PRF-01)
export const MAX_APP_SHELL_GZIP_BYTES = 180 * 1024; // 180 KB (BR-PRF-01 §7.1)
export const MAX_PUBLIC_PAGE_GZIP_BYTES = 500 * 1024; // 500 KB (BR-PRF-01 §7.1)
export const MAX_LEVEL_PAYLOAD_BYTES = 200 * 1024; // 200 KB (BR-PRF-01 §7.1)

export interface ChunkReport {
  readonly filename: string;
  readonly rawBytes: number;
  readonly gzipBytes: number;
  readonly passed: boolean;
}

export interface BudgetViolation {
  readonly category:
    | "template_chunk"
    | "web_app_shell"
    | "admin_app_shell"
    | "public_page"
    | "level_payload";
  readonly target: string;
  readonly actualBytes: number;
  readonly limitBytes: number;
}

export interface LevelPayloadEntry {
  readonly code: string;
  readonly payload:
    | string
    | Record<string, string | number | boolean | null | object>;
}

export interface PrecomputedResource {
  readonly file?: string;
  readonly resourceType?: string;
  readonly name?: string;
}

export interface PrecomputedDependency {
  readonly preload?: Readonly<Record<string, PrecomputedResource>>;
}

export interface PrecomputedManifest {
  readonly entrypoints?: readonly string[];
  readonly dependencies?: Readonly<Record<string, PrecomputedDependency>>;
}

export interface BundleCheckInput {
  readonly webOutputDir?: string;
  readonly adminOutputDir?: string;
  readonly precomputed?: PrecomputedManifest | null;
  readonly levelPayloads?: readonly LevelPayloadEntry[];
}

export interface BundleCheckReport {
  readonly passed: boolean;
  readonly chunks: readonly ChunkReport[];
  readonly webAppShellGzipBytes: number;
  readonly adminAppShellGzipBytes: number;
  readonly publicPageGzipBytes: number;
  readonly maxLevelPayloadBytes: number;
  readonly violations: readonly BudgetViolation[];
}

const PRELOAD_HREF_REGEX =
  /rel="(?:modulepreload|stylesheet)"[^>]*href="\/_nuxt\/([^"]+)"/g;

function findAssetFiles(dir: string, extensions: readonly string[]): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findAssetFiles(fullPath, extensions));
    } else if (
      entry.isFile() &&
      extensions.some((ext) => entry.name.endsWith(ext))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractPreloadFilesFromHtml(html: string): Set<string> {
  const preloadFiles = new Set<string>();
  PRELOAD_HREF_REGEX.lastIndex = 0;
  let match = PRELOAD_HREF_REGEX.exec(html);
  while (match !== null) {
    if (match[1]) {
      preloadFiles.add(match[1]);
    }
    match = PRELOAD_HREF_REGEX.exec(html);
  }
  return preloadFiles;
}

function sumGzipBytesForFiles(
  files: Iterable<string>,
  gzipByRelPath: ReadonlyMap<string, number>
): number {
  let sum = 0;
  for (const rel of files) {
    sum += gzipByRelPath.get(rel) ?? 0;
  }
  return sum;
}

function computeHtmlShellGzipBytes(
  htmlPath: string,
  nuxtDir: string,
  gzipByRelPath: ReadonlyMap<string, number>
): number {
  if (existsSync(htmlPath)) {
    const preloadFiles = extractPreloadFilesFromHtml(
      readFileSync(htmlPath, "utf8")
    );
    if (preloadFiles.size > 0) {
      return sumGzipBytesForFiles(preloadFiles, gzipByRelPath);
    }
  }

  let fallbackSum = 0;
  for (const [rel, gz] of gzipByRelPath.entries()) {
    if (rel.startsWith("entry") || rel.includes("app-shell")) {
      fallbackSum += gz;
    }
  }
  if (fallbackSum > 0 || !existsSync(nuxtDir)) {
    return fallbackSum;
  }
  for (const gz of gzipByRelPath.values()) {
    fallbackSum += gz;
  }
  return fallbackSum;
}

function collectDirectoryGzipMap(nuxtDir: string): {
  gzipByRelPath: Map<string, number>;
  rawByRelPath: Map<string, number>;
} {
  const gzipByRelPath = new Map<string, number>();
  const rawByRelPath = new Map<string, number>();
  const files = findAssetFiles(nuxtDir, [".js", ".mjs", ".css"]);
  for (const file of files) {
    const content = readFileSync(file);
    const rel = file.slice(nuxtDir.length + 1);
    rawByRelPath.set(rel, content.length);
    gzipByRelPath.set(rel, gzipSync(content).length);
  }
  return { gzipByRelPath, rawByRelPath };
}

function collectJsPreloadFiles(
  preload: Readonly<Record<string, PrecomputedResource>>
): Set<string> {
  const files = new Set<string>();
  for (const res of Object.values(preload)) {
    if (res.file && (res.file.endsWith(".js") || res.file.endsWith(".mjs"))) {
      files.add(res.file);
    }
  }
  return files;
}

function evaluateTemplatePreloads(
  precomputed: PrecomputedManifest | null | undefined,
  gzipByRelPath: ReadonlyMap<string, number>,
  violations: BudgetViolation[]
): void {
  if (!precomputed?.dependencies) {
    return;
  }
  for (const [key, dep] of Object.entries(precomputed.dependencies)) {
    if (!(key.includes("templates/GT-") && dep.preload)) {
      continue;
    }
    const files = collectJsPreloadFiles(dep.preload);
    const totalGzip = sumGzipBytesForFiles(files, gzipByRelPath);
    if (totalGzip > MAX_TEMPLATE_CHUNK_GZIP_BYTES) {
      violations.push({
        category: "template_chunk",
        target: key,
        actualBytes: totalGzip,
        limitBytes: MAX_TEMPLATE_CHUNK_GZIP_BYTES,
      });
    }
  }
}

function computeWebAppShellBytes(
  webOutputDir: string,
  nuxtDir: string,
  precomputed: PrecomputedManifest | null | undefined,
  gzipByRelPath: ReadonlyMap<string, number>
): number {
  const epKey = precomputed?.entrypoints?.[0];
  const epPreload =
    epKey && precomputed?.dependencies
      ? precomputed.dependencies[epKey]?.preload
      : undefined;

  if (epPreload) {
    const shellFiles = new Set<string>();
    for (const res of Object.values(epPreload)) {
      if (res.file) {
        shellFiles.add(res.file);
      }
    }
    return sumGzipBytesForFiles(shellFiles, gzipByRelPath);
  }

  return computeHtmlShellGzipBytes(
    join(webOutputDir, "public/index.html"),
    nuxtDir,
    gzipByRelPath
  );
}

function evaluateWebChunks(
  gzipByRelPath: ReadonlyMap<string, number>,
  rawByRelPath: ReadonlyMap<string, number>,
  chunks: ChunkReport[],
  violations: BudgetViolation[]
): void {
  for (const [filename, gzipBytes] of gzipByRelPath.entries()) {
    if (!(filename.endsWith(".js") || filename.endsWith(".mjs"))) {
      continue;
    }
    const rawBytes = rawByRelPath.get(filename) ?? 0;
    const passed = gzipBytes <= MAX_TEMPLATE_CHUNK_GZIP_BYTES;
    chunks.push({ filename, rawBytes, gzipBytes, passed });
    if (!passed) {
      violations.push({
        category: "template_chunk",
        target: filename,
        actualBytes: gzipBytes,
        limitBytes: MAX_TEMPLATE_CHUNK_GZIP_BYTES,
      });
    }
  }
}

function evaluateLevelPayloads(
  levelPayloads: readonly LevelPayloadEntry[],
  violations: BudgetViolation[]
): number {
  let maxLevelPayloadBytes = 0;
  for (const item of levelPayloads) {
    const serialized =
      typeof item.payload === "string"
        ? item.payload
        : JSON.stringify(item.payload);
    const bytes = Buffer.byteLength(serialized, "utf8");
    if (bytes > maxLevelPayloadBytes) {
      maxLevelPayloadBytes = bytes;
    }
    if (bytes > MAX_LEVEL_PAYLOAD_BYTES) {
      violations.push({
        category: "level_payload",
        target: item.code,
        actualBytes: bytes,
        limitBytes: MAX_LEVEL_PAYLOAD_BYTES,
      });
    }
  }
  return maxLevelPayloadBytes;
}

export function evaluateBundleBudgets(
  input: BundleCheckInput
): BundleCheckReport {
  const webOutputDir =
    input.webOutputDir ?? join(REPO_ROOT, "apps/web/.output");
  const adminOutputDir =
    input.adminOutputDir ?? join(REPO_ROOT, "apps/admin/.output");
  const webNuxtDir = join(webOutputDir, "public/_nuxt");
  const { gzipByRelPath, rawByRelPath } = collectDirectoryGzipMap(webNuxtDir);

  const chunks: ChunkReport[] = [];
  const violations: BudgetViolation[] = [];

  evaluateWebChunks(gzipByRelPath, rawByRelPath, chunks, violations);
  evaluateTemplatePreloads(input.precomputed, gzipByRelPath, violations);

  const webAppShellGzipBytes = computeWebAppShellBytes(
    webOutputDir,
    webNuxtDir,
    input.precomputed,
    gzipByRelPath
  );
  if (webAppShellGzipBytes > MAX_APP_SHELL_GZIP_BYTES) {
    violations.push({
      category: "web_app_shell",
      target: "apps/web app shell",
      actualBytes: webAppShellGzipBytes,
      limitBytes: MAX_APP_SHELL_GZIP_BYTES,
    });
  }

  let publicPageGzipBytes = 0;
  for (const gz of gzipByRelPath.values()) {
    publicPageGzipBytes += gz;
  }
  if (publicPageGzipBytes > MAX_PUBLIC_PAGE_GZIP_BYTES) {
    violations.push({
      category: "public_page",
      target: "apps/web public bundle",
      actualBytes: publicPageGzipBytes,
      limitBytes: MAX_PUBLIC_PAGE_GZIP_BYTES,
    });
  }

  let adminAppShellGzipBytes = 0;
  const adminNuxtDir = join(adminOutputDir, "public/_nuxt");
  if (existsSync(adminNuxtDir)) {
    const adminMap = collectDirectoryGzipMap(adminNuxtDir);
    adminAppShellGzipBytes = computeHtmlShellGzipBytes(
      join(adminOutputDir, "public/index.html"),
      adminNuxtDir,
      adminMap.gzipByRelPath
    );
    if (adminAppShellGzipBytes > MAX_APP_SHELL_GZIP_BYTES) {
      violations.push({
        category: "admin_app_shell",
        target: "apps/admin app shell",
        actualBytes: adminAppShellGzipBytes,
        limitBytes: MAX_APP_SHELL_GZIP_BYTES,
      });
    }
  }

  const maxLevelPayloadBytes = evaluateLevelPayloads(
    input.levelPayloads ?? [],
    violations
  );

  return {
    passed: violations.length === 0,
    chunks,
    webAppShellGzipBytes,
    adminAppShellGzipBytes,
    publicPageGzipBytes,
    maxLevelPayloadBytes,
    violations,
  };
}

async function loadPrecomputedManifest(
  webOutputDir: string
): Promise<PrecomputedManifest | null> {
  const precomputedPath = join(
    webOutputDir,
    "server/chunks/virtual/precomputed.mjs"
  );
  if (!existsSync(precomputedPath)) {
    return null;
  }
  try {
    const mod = (await import(pathToFileURL(precomputedPath).href)) as {
      default?: PrecomputedManifest | (() => PrecomputedManifest);
    };
    if (typeof mod.default === "function") {
      return mod.default();
    }
    return mod.default ?? null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const webOutputDir = join(REPO_ROOT, "apps/web/.output");
  const adminOutputDir = join(REPO_ROOT, "apps/admin/.output");

  console.log("Checking bundle budgets (BR-PRF-01, BR-ENG-17)...");

  if (!existsSync(webOutputDir)) {
    console.log(
      "No apps/web/.output found. Running 'pnpm --filter @mindkid/web build'..."
    );
    execSync("pnpm --filter @mindkid/web build", {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });
  }

  const precomputed = await loadPrecomputedManifest(webOutputDir);
  const report = evaluateBundleBudgets({
    webOutputDir,
    adminOutputDir,
    precomputed,
  });

  if (report.chunks.length === 0) {
    console.warn(`Warning: No client chunks found in ${webOutputDir}`);
    return;
  }

  console.log("\n--- Bundle Budget Summary ---");
  console.log(
    `Web App Shell:   ${(report.webAppShellGzipBytes / 1024).toFixed(2)} KB / ${(MAX_APP_SHELL_GZIP_BYTES / 1024).toFixed(0)} KB`
  );
  if (report.adminAppShellGzipBytes > 0) {
    console.log(
      `Admin App Shell: ${(report.adminAppShellGzipBytes / 1024).toFixed(2)} KB / ${(MAX_APP_SHELL_GZIP_BYTES / 1024).toFixed(0)} KB`
    );
  }
  console.log(
    `Web Public Page: ${(report.publicPageGzipBytes / 1024).toFixed(2)} KB / ${(MAX_PUBLIC_PAGE_GZIP_BYTES / 1024).toFixed(0)} KB`
  );
  console.log(
    `Client Chunks:   ${report.chunks.length} checked (limit ${(MAX_TEMPLATE_CHUNK_GZIP_BYTES / 1024).toFixed(0)} KB gzip/chunk)`
  );

  if (!report.passed) {
    console.error("\nError: Bundle budget violations detected (BR-PRF-01):");
    for (const v of report.violations) {
      console.error(
        `  - [${v.category}] ${v.target}: ${(v.actualBytes / 1024).toFixed(2)} KB > ${(v.limitBytes / 1024).toFixed(2)} KB`
      );
    }
    process.exit(1);
  }

  console.log("\nAll checked bundles and chunks are within budget.");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
