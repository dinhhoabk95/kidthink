/**
 * Static scanner gates for Child Data Compliance rules BR-CDC-08 and BR-CDC-11.
 * Called during pnpm check or test suite to ensure compliance before code is written.
 */

export interface CodeFileFixture {
  filePath: string;
  content: string;
}

/**
 * BR-CDC-08: Ensures no 3rd-party tracking scripts or domains exist in /play/** or legal pages.
 */
export function scanTrackingScripts(files: CodeFileFixture[]): void {
  const forbiddenDomainsAndScripts = [
    "google-analytics.com",
    "googletagmanager.com",
    "connect.facebook.net",
    "fbevents.js",
    "cdn.mixpanel.com",
    "cdn.segment.com",
    "amplitude.com",
    "hotjar.com",
  ];

  for (const f of files) {
    if (
      f.filePath.includes("/play/") ||
      f.filePath.includes("/legal/") ||
      f.filePath.includes("/terms") ||
      f.filePath.includes("/privacy")
    ) {
      const lower = f.content.toLowerCase();
      for (const forbidden of forbiddenDomainsAndScripts) {
        if (lower.includes(forbidden)) {
          throw new Error(
            `BR-CDC-08 VIOLATION: 3rd-party tracking script/domain "${forbidden}" found in sensitive page ${f.filePath}`
          );
        }
      }
    }
  }
}

function scanSchemaChildCredentials(schemaFiles: CodeFileFixture[]): void {
  const forbiddenColumnPatterns = ["password", "token"];
  for (const f of schemaFiles) {
    if (!f.filePath.includes("child")) {
      continue;
    }
    const lower = f.content.toLowerCase();
    for (const pattern of forbiddenColumnPatterns) {
      if (lower.includes(`${pattern}_`) || lower.includes(`_${pattern}`)) {
        throw new Error(
          `BR-CDC-11 VIOLATION: Credential column pattern "${pattern}" found in child schema ${f.filePath}`
        );
      }
    }
  }
}

function scanRoutesChildLogin(routeFiles: CodeFileFixture[]): void {
  const forbiddenRoutes = [
    "/children/login",
    "/child/login",
    "/api/children/login",
    "children/login",
  ];
  for (const r of routeFiles) {
    const lowerContent = r.content.toLowerCase();
    const lowerPath = r.filePath.toLowerCase();
    for (const route of forbiddenRoutes) {
      if (lowerContent.includes(route) || lowerPath.includes(route)) {
        throw new Error(
          `BR-CDC-11 VIOLATION: Child login route "${route}" found in ${r.filePath}`
        );
      }
    }
  }
}

/**
 * BR-CDC-11: Ensures no credential columns exist on child tables, and no child login routes exist.
 */
export function scanChildCredentialRoutesAndColumns(
  schemaFiles: CodeFileFixture[],
  routeFiles: CodeFileFixture[]
): void {
  scanSchemaChildCredentials(schemaFiles);
  scanRoutesChildLogin(routeFiles);
}
