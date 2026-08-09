import { describe, expect, it } from "vitest";
import { buildExternalProviderPayload } from "../../packages/shared/src/index.ts";
import {
  scanChildCredentialRoutesAndColumns,
  scanTrackingScripts,
} from "../check-child-data-compliance-gates.ts";

const ERR_CDC_08 = /BR-CDC-08 VIOLATION/;
const ERR_CDC_11 = /BR-CDC-11 VIOLATION/;
const ERR_CDC_06 = /BR-CDC-06 VIOLATION/;

describe("Static Compliance Gates — Task 11", () => {
  it("BR-CDC-08: scanTrackingScripts passes clean code and fails when 3rd party script is introduced in /play/", () => {
    const cleanFiles = [
      {
        filePath: "apps/web/pages/play/index.vue",
        content: "<div>Play Game Canvas</div>",
      },
      {
        filePath: "apps/web/pages/privacy.vue",
        content: "<h1>Chính sách bảo mật</h1>",
      },
    ];

    expect(() => scanTrackingScripts(cleanFiles)).not.toThrow();

    // RED negative test fixture: 3rd party analytics script in /play/
    const dirtyFiles = [
      {
        filePath: "apps/web/pages/play/index.vue",
        content:
          "<script src='https://www.google-analytics.com/analytics.js'></script>",
      },
    ];

    expect(() => scanTrackingScripts(dirtyFiles)).toThrowError(ERR_CDC_08);
  });

  it("BR-CDC-11: scanChildCredentialRoutesAndColumns rejects child password/token columns and child login routes", () => {
    const cleanSchema = [
      {
        filePath: "packages/db/src/schema/child.ts",
        content:
          "export const childProfiles = pgTable('child_profiles', {...});",
      },
    ];
    const cleanRoutes = [
      {
        filePath: "apps/web/server/api/auth/login.ts",
        content: "defineEventHandler(() => { return { user_id: 1 }; });",
      },
    ];

    expect(() =>
      scanChildCredentialRoutesAndColumns(cleanSchema, cleanRoutes)
    ).not.toThrow();

    // RED negative test 1: child table containing password column
    const dirtySchema = [
      {
        filePath: "packages/db/src/schema/child.ts",
        content: "child_password_hash: varchar('child_password_hash')",
      },
    ];

    expect(() =>
      scanChildCredentialRoutesAndColumns(dirtySchema, cleanRoutes)
    ).toThrowError(ERR_CDC_11);

    // RED negative test 2: route containing child login endpoint
    const dirtyRoutes = [
      {
        filePath: "apps/web/server/api/children/login.ts",
        content: "export default defineEventHandler(() => {});",
      },
    ];

    expect(() =>
      scanChildCredentialRoutesAndColumns(cleanSchema, dirtyRoutes)
    ).toThrowError(ERR_CDC_11);
  });

  it("BR-CDC-06: buildExternalProviderPayload accepts aggregated metrics and rejects individual child PII fields", () => {
    const safePayload = {
      total_users_count: 50,
      aggregate_completion_rate: 0.85,
      level_code: "GL-C1-NUM-01",
    };

    const result = buildExternalProviderPayload(safePayload);
    expect(result.total_users_count).toBe(50);

    // RED negative test: passing individual child_uuid
    expect(() =>
      buildExternalProviderPayload({
        ...safePayload,
        child_uuid: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      })
    ).toThrowError(ERR_CDC_06);

    // RED negative test: passing display_name
    expect(() =>
      buildExternalProviderPayload({
        ...safePayload,
        display_name: "Bé An",
      })
    ).toThrowError(ERR_CDC_06);
  });
});
