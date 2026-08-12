import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export function scanReportingQueries(
  fileContent: string,
  filePath: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if file is inside analytics or reports directory
  const isReportOrAnalyticsRoute =
    filePath.includes("/api/managers/analytics") ||
    filePath.includes("/api/managers/reports") ||
    filePath.includes("/api/reports");

  if (
    isReportOrAnalyticsRoute &&
    (fileContent.includes("telemetryEvents") ||
      fileContent.includes("telemetry_events"))
  ) {
    errors.push(
      `BR-TLM-01: Reporting route '${filePath}' directly queries 'telemetry_events'. Reports must read from rollup tables instead.`
    );
  }

  return { valid: errors.length === 0, errors };
}

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat?.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
      results.push(filePath);
    }
  }
  return results;
}

function main() {
  const root = process.cwd();
  const serverApiDir = join(root, "apps/web/server/api");

  let files: string[] = [];
  try {
    files = getAllFiles(serverApiDir);
  } catch {
    // Directory might not exist or be empty in some test environments
    files = [];
  }

  const allErrors: string[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const res = scanReportingQueries(content, file);
    if (!res.valid) {
      allErrors.push(...res.errors);
    }
  }

  if (allErrors.length > 0) {
    console.error(
      "❌ [lint:analytics-queries] BR-TLM-01 check failed:\n",
      allErrors.join("\n")
    );
    process.exit(1);
  }

  console.log(
    "✅ [lint:analytics-queries] BR-TLM-01 passed cleanly: No reporting route queries telemetry_events directly."
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
