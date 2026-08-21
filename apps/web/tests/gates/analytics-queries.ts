import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";

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

/** BR-TLM-01 trên toàn bộ `apps/web/server/api` thật. */
export function runAnalyticsQueriesGate(): string[] {
  const files = getAllFiles(join(REPO_ROOT, "apps/web/server/api"));

  return files.flatMap((file) => {
    const result = scanReportingQueries(readFileSync(file, "utf-8"), file);
    return result.valid ? [] : result.errors;
  });
}
