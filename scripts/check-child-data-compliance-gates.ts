import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Static scanner gates for Child Data Compliance rules BR-CDC-08 and BR-CDC-11,
 * and Admin Route Compliance rules BR-USM-07, BR-USM-08, BR-CPA-01, BR-CPA-06, BR-CPA-07, BR-CPA-08 (D-JB).
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

/**
 * BR-USM-07: Ensures no admin/manager route performs a hard delete on users.
 */
const DELETE_FROM_USERS_REGEX = /delete\s+from\s+users/i;
const DELETE_FROM_CHILD_PROFILES_REGEX = /delete\s+from\s+child_profiles/i;
const CODE_FILE_EXTENSION_REGEX = /\.(ts|js|vue)$/;

export function scanAdminUsersNoDelete(files: CodeFileFixture[]): void {
  for (const f of files) {
    const isManagerRoute =
      f.filePath.includes("/managers/") ||
      f.filePath.includes("/admin/") ||
      f.filePath.includes("manager");
    if (!isManagerRoute) {
      continue;
    }

    const lowerPath = f.filePath.toLowerCase();
    if (
      (lowerPath.includes("/managers/users/") ||
        lowerPath.includes("/managers/users.")) &&
      lowerPath.includes("delete")
    ) {
      throw new Error(
        `BR-USM-07 VIOLATION: Hard delete route on users table found in ${f.filePath}`
      );
    }

    const content = f.content;
    if (
      content.includes("delete(users)") ||
      content.includes(".delete(users)") ||
      DELETE_FROM_USERS_REGEX.test(content)
    ) {
      throw new Error(
        `BR-USM-07 VIOLATION: Hard delete query on users table found in ${f.filePath}`
      );
    }
  }
}

/**
 * BR-USM-08: Ensures no admin/manager handler writes or updates user password_hash directly.
 */
export function scanAdminNoPasswordWrite(files: CodeFileFixture[]): void {
  for (const f of files) {
    const isManagerRoute =
      f.filePath.includes("/managers/") ||
      f.filePath.includes("/admin/") ||
      f.filePath.includes("manager");
    if (!isManagerRoute) {
      continue;
    }

    const content = f.content;
    // Check for passwordHash / password_hash being written in updates
    if (
      (content.includes("passwordHash:") ||
        content.includes("password_hash:") ||
        content.includes("passwordHash =") ||
        content.includes("password_hash =")) &&
      (content.includes("users") || content.includes(".update("))
    ) {
      throw new Error(
        `BR-USM-08 VIOLATION: Direct password_hash write found in admin handler ${f.filePath}. Only password reset link is allowed.`
      );
    }
  }
}

/**
 * BR-CPA-01: Ensures no admin route lists child_profiles globally without a user_id constraint.
 */
export function scanAdminChildProfilesBoundToUser(
  files: CodeFileFixture[]
): void {
  for (const f of files) {
    const isManagerRoute =
      f.filePath.includes("/managers/") ||
      f.filePath.includes("/admin/") ||
      f.filePath.includes("manager");
    if (!isManagerRoute) {
      continue;
    }

    const lowerPath = f.filePath.toLowerCase();
    // Route like /api/managers/children.get.ts or /api/managers/children/index.get.ts (global child list)
    if (
      lowerPath.includes("/managers/children.get.ts") ||
      lowerPath.includes("/managers/children/index.get.ts") ||
      (lowerPath.includes("/managers/children") &&
        lowerPath.includes(".get.ts") &&
        !lowerPath.includes("[uuid]") &&
        !lowerPath.includes("[id]"))
    ) {
      throw new Error(
        `BR-CPA-01 VIOLATION: Global child profile listing endpoint found in ${f.filePath}. Child profiles must only be accessed scoped to a specific user.`
      );
    }

    // Check if query selects from childProfiles without userId/user_id filtering
    if (
      f.content.includes("from(childProfiles)") &&
      !f.content.includes("userId") &&
      !f.content.includes("user_id") &&
      !f.content.includes("eq(childProfiles.uuid")
    ) {
      throw new Error(
        `BR-CPA-01 VIOLATION: Query on child_profiles without user_id constraint found in ${f.filePath}`
      );
    }
  }
}

/**
 * BR-CPA-06: Ensures admin cannot PATCH / update general fields on child_profiles (only archive is permitted).
 */
export function scanAdminChildProfilesNoPatchExceptArchive(
  files: CodeFileFixture[]
): void {
  for (const f of files) {
    const isManagerRoute =
      f.filePath.includes("/managers/") ||
      f.filePath.includes("/admin/") ||
      f.filePath.includes("manager");
    if (!isManagerRoute) {
      continue;
    }

    const lowerPath = f.filePath.toLowerCase();
    if (
      lowerPath.includes("children") &&
      (lowerPath.includes(".patch.ts") || lowerPath.includes(".put.ts"))
    ) {
      throw new Error(
        `BR-CPA-06 VIOLATION: Admin PATCH/PUT route on child_profiles found in ${f.filePath}. Admin cannot modify child profile data directly.`
      );
    }

    // If updating child_profiles, only status: 'archived' is allowed
    if (
      (f.content.includes(".update(childProfiles)") ||
        f.content.includes("update child_profiles")) &&
      (f.content.includes("displayName") ||
        f.content.includes("birthYear") ||
        f.content.includes("avatarId"))
    ) {
      throw new Error(
        `BR-CPA-06 VIOLATION: Direct field update on child_profiles found in ${f.filePath}. Only archive operation is permitted.`
      );
    }
  }
}

/**
 * BR-CPA-07: Ensures admin cannot DELETE child_profiles (only archive is permitted).
 */
export function scanAdminChildProfilesNoDelete(files: CodeFileFixture[]): void {
  for (const f of files) {
    const isManagerRoute =
      f.filePath.includes("/managers/") ||
      f.filePath.includes("/admin/") ||
      f.filePath.includes("manager");
    if (!isManagerRoute) {
      continue;
    }

    const lowerPath = f.filePath.toLowerCase();
    if (lowerPath.includes("children") && lowerPath.includes("delete")) {
      throw new Error(
        `BR-CPA-07 VIOLATION: Admin DELETE route on child_profiles found in ${f.filePath}. Child profiles can only be archived, not hard-deleted by admin.`
      );
    }

    const content = f.content;
    if (
      content.includes("delete(childProfiles)") ||
      content.includes(".delete(childProfiles)") ||
      DELETE_FROM_CHILD_PROFILES_REGEX.test(content)
    ) {
      throw new Error(
        `BR-CPA-07 VIOLATION: Hard delete query on child_profiles found in ${f.filePath}`
      );
    }
  }
}

/**
 * BR-CPA-08: Ensures no admin query schema accepts child name as a search parameter.
 */
export function scanAdminQueryNoChildNameParam(files: CodeFileFixture[]): void {
  for (const f of files) {
    const isManagerRoute =
      f.filePath.includes("/managers/") ||
      f.filePath.includes("/admin/") ||
      f.filePath.includes("manager");
    if (!isManagerRoute) {
      continue;
    }

    const content = f.content;
    if (
      (content.includes("child_name") || content.includes("childName")) &&
      (content.includes("z.object") ||
        content.includes("getQuery") ||
        content.includes("query"))
    ) {
      throw new Error(
        `BR-CPA-08 VIOLATION: Child name query parameter found in admin route ${f.filePath}. Searching children by name on admin surfaces is strictly forbidden.`
      );
    }
  }
}

/**
 * BR-PAY-08: Ensures no route performs a hard delete on payment_orders table.
 */
const DELETE_FROM_PAYMENT_ORDERS_REGEX = /delete\s+from\s+payment_orders/i;

export function scanPaymentOrdersNoDelete(files: CodeFileFixture[]): void {
  for (const f of files) {
    const lowerPath = f.filePath.toLowerCase();
    if (
      (lowerPath.includes("/orders") || lowerPath.includes("/payments")) &&
      (lowerPath.includes("delete") || lowerPath.includes(".delete.ts"))
    ) {
      throw new Error(
        `BR-PAY-08 VIOLATION: Hard delete route on payment_orders table found in ${f.filePath}`
      );
    }

    const content = f.content;
    if (
      content.includes("delete(paymentOrders)") ||
      content.includes(".delete(paymentOrders)") ||
      DELETE_FROM_PAYMENT_ORDERS_REGEX.test(content)
    ) {
      throw new Error(
        `BR-PAY-08 VIOLATION: Hard delete query on payment_orders table found in ${f.filePath}`
      );
    }
  }
}

/**
 * D-JB / BR-PAY-08: Master gate scanning admin & api routes against forbidden capabilities.
 */
export function scanAdminRouteGates(routeFiles: CodeFileFixture[]): void {
  scanAdminUsersNoDelete(routeFiles);
  scanAdminNoPasswordWrite(routeFiles);
  scanAdminChildProfilesBoundToUser(routeFiles);
  scanAdminChildProfilesNoPatchExceptArchive(routeFiles);
  scanAdminChildProfilesNoDelete(routeFiles);
  scanAdminQueryNoChildNameParam(routeFiles);
  scanPaymentOrdersNoDelete(routeFiles);
}

// Scanner utility for real directories
export function scanDirectoryFiles(dir: string): CodeFileFixture[] {
  const results: CodeFileFixture[] = [];
  function walk(current: string) {
    if (!existsSync(current)) {
      return;
    }
    const entries = readdirSync(current);
    for (const entry of entries) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (CODE_FILE_EXTENSION_REGEX.test(entry)) {
        results.push({
          filePath: full,
          content: readFileSync(full, "utf-8"),
        });
      }
    }
  }
  walk(dir);
  return results;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const apiRoutes = [
    ...scanDirectoryFiles(join(process.cwd(), "apps/web/server/api/managers")),
    ...scanDirectoryFiles(join(process.cwd(), "apps/web/server/api/users")),
    ...scanDirectoryFiles(join(process.cwd(), "apps/web/server/api/guest")),
  ];
  try {
    scanAdminRouteGates(apiRoutes);
    console.log(
      "✅ [lint:admin-route-gates] 0 violations across admin/api routes (BR-USM-07, BR-USM-08, BR-CPA-01, BR-CPA-06, BR-CPA-07, BR-CPA-08, BR-PAY-08)."
    );
  } catch (err: unknown) {
    console.error(`❌ ${(err as Error).message}`);
    process.exit(1);
  }
}
